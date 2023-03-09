import { createClient } from './autogen/client/createClient';
import fse from 'fs-extra';
import { kebabCase, omit } from 'lodash';
import chalk from 'chalk';
import { readAsJson, getFiles, getDirectories, replaceField, updateIdsMap, replaceIds } from './utils';
import cliProgress from 'cli-progress';

const MULTIBAR = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: '|{bar}| {name} | {value}/{total}',
  },
  cliProgress.Presets.shades_grey
);

const root = 'https://cdn.builder.io';

const createGraphqlClient = (privateKey: string) =>
  createClient({
    fetcher: ({ query, variables }, fetch, qs) =>
      fetch(`${root}/api/v2/admin`, {
        method: 'POST',
        body: JSON.stringify({ query, variables }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${privateKey}`,
        },
      }).then(r => r.json()),
  });

export const importSpace = async (
  privateKey: string,
  directory: string,
  debug = false,
  limit = 100,
  offset = 0
) => {
  const graphqlClient = createGraphqlClient(privateKey);

  const spaceProgress = MULTIBAR.create(1, 0);
  spaceProgress.start(1, 0, { name: 'getting space settings' });

  try {
    const space = await graphqlClient.chain.query
      .downloadClone({
        contentQuery: {
          limit,
          offset,
        },
      })
      .execute({
        models: { name: true, everything: true, content: true },
        settings: true,
        meta: true,
      });
    spaceProgress.setTotal(space.models.length);
    await fse.outputFile(
      `${directory}/settings.json`,
      JSON.stringify({ ...space.settings, cloneInfo: space.meta }, undefined, 2)
    );
    const modelOps = space.models.map(async (model, index) => {
      const { content, everything } = model;
      // todo why conent is in everything
      const { content: _, ...schema } = everything;
      const modelName = kebabCase(model.name);
      await fse.emptyDir(`${directory}/${modelName}`);
      const modelProgress = MULTIBAR.create(content.length, 0, { name: modelName });
      if (content.length > 0) {
        modelProgress.start(content.length, 0);
      }
      await fse.outputFile(
        `${directory}/${modelName}/schema.model.json`,
        JSON.stringify(schema, null, 2)
      );
      await Promise.all(
        content.map(async (entry, index) => {
          const filename = `${directory}/${modelName}/${kebabCase(entry.name)}.json`;
          await fse.outputFile(filename, JSON.stringify(entry, undefined, 2));
          modelProgress.increment(1, { name: ` ${modelName}: ${filename} ` });
        })
      );
      spaceProgress.increment();
      modelProgress.stop();
    });
    await Promise.all(modelOps);
    if (debug) {
      console.log(chalk.green('Imported successfully ', space.settings.name));
    }
  } catch (e) {
    console.log(`\r\n\r\n`);
    console.error(chalk.red('Error importing space'));
    console.error(e);
    process.exit();
  }

  spaceProgress.stop();
  MULTIBAR.stop();
};

export const addModel = async (privateKey: string, directory: string, model: string) => {
  const graphqlClient = createGraphqlClient(privateKey);
  const spaceSettings = await readAsJson(`${directory}/settings.json`);

  try {
    const {settings: { parentOrganization: organizationId }} = await graphqlClient.chain.query.settings.execute()
    const spaceModelIdsMap = updateIdsMap(spaceSettings.cloneInfo.modelIdMap, organizationId);

    const upload = async (modelName: string, organizationId: string, spaceId: string, graphqlClient: any) => {
      const modelProgress = MULTIBAR.create(1, 0, { name: modelName });
      const body = replaceField(
        await readAsJson(`${directory}/${modelName}/schema.model.json`),
        organizationId,
        spaceId
      );

      modelProgress.increment(1, {
        name: `${modelName}: uploading`,
      });

      const model = await graphqlClient.chain.mutation
        .addModel({ body: replaceIds(body, spaceModelIdsMap) })
        .execute({ id: true, name: true });

      modelProgress.stop();
      
      return model
    }

    await upload(model, organizationId, spaceSettings.id, graphqlClient)
  } catch (e) {
    console.log(`\r\n\r\n`);
    console.error(chalk.red('Error adding model'));
    console.error(e);
    process.exit();
  }

  MULTIBAR.stop();
}

export const newSpace = async (
  privateKey: string,
  directory: string,
  name?: string,
  debug = false
) => {
  const graphqlClient = createGraphqlClient(privateKey);

  const spaceSettings = await readAsJson(`${directory}/settings.json`);
  try {
    const { organization, privateKey: newSpacePrivateKey } = await graphqlClient.chain.mutation
      .createSpace({
        settings: {
          ...omit(spaceSettings, 'cloneInfo'),
          name: name || spaceSettings.name,
        },
      })
      .execute();
    const newSpaceAdminClient = createGraphqlClient(newSpacePrivateKey.key);

    const spaceModelIdsMap = updateIdsMap(spaceSettings.cloneInfo.modelIdMap, organization.id);
    const spaceContentIdsMap = updateIdsMap(spaceSettings.cloneInfo.contentIdMap, organization.id);

    const models = await getDirectories(`${directory}`);
    const modelsPromises = models.map(async ({ name: modelName }) => {
      const body = replaceField(
        await readAsJson(`${directory}/${modelName}/schema.model.json`),
        organization.id,
        spaceSettings.id
      );
      const model = await newSpaceAdminClient.chain.mutation
        .addModel({ body: replaceIds(body, spaceModelIdsMap, spaceContentIdsMap) })
        .execute({ id: true, name: true });
      if (model) {
        const content = (await getFiles(`${directory}/${modelName}`)).filter(
          file => file.name !== 'schema.model.json'
        );
        const modelProgress = MULTIBAR.create(content.length, 0, { name: modelName });
        if (content.length > 0) {
          modelProgress.start(content.length, 0, { name: modelName });
        }
        const writeApi = `https://builder.io/api/v1/write/${modelName}`;
        const contentPromises = content.map(async (contentFile, index) => {
          let contentJSON = replaceIds(
            replaceField(
              await readAsJson(`${directory}/${modelName}/${contentFile.name}`),
              organization.id,
              spaceSettings.id
            )
          );
          modelProgress.increment(1, {
            name: `${modelName}: writing ${contentFile.name}`,
          });
          // post content to write api using the new space private api key
          await fetch(writeApi, {
            method: 'POST',
            body: JSON.stringify(contentJSON),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newSpacePrivateKey.key}`,
            },
          });
        });
        await Promise.all(contentPromises);
        modelProgress.stop();
      }
    });
    await Promise.all(modelsPromises);
    if (debug) {
      console.log(`\r\n\r\n`);
      console.log(
        chalk.green(`Your new space "${organization.name}" public API Key: ${organization.id}`)
      );
      console.log(`\r\n\r\n`);
    }
  } catch (e) {
    console.log(`\r\n\r\n`);
    console.error(chalk.red('Error creating space'));
    console.error(e);
    process.exit();
  }

  MULTIBAR.stop();
};
