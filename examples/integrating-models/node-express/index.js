const express = require('express');
const axios = require('axios');

const app = express();
// TODO: Replace with your Builder public API key
const apiKey = '77ef16bfb97145249d018edf89ba2eb0';
const port = 3000;

const handleError = err => {
  // Builder did not match a section
  if (err.response.status === 404) {
    return { data: null };
  }
  throw err;
};

// Catchall route
app.get('*', async (req, res) => {
  const encodedUrl = encodeURIComponent(req.url);
  const { data: headerData } = await axios
    .get(`https://cdn.builder.io/api/v1/html/section?apiKey=${apiKey}&userAttributes.name=Header`)
    .catch(handleError);
  const { data: pageData } = await axios
    .get(`https://cdn.builder.io/api/v1/html/page?apiKey=${apiKey}&url=${encodedUrl}`)
    .catch(handleError);

  if (headerData && pageData) {
    const headerHtml = headerData.data.html;
    const pageHtml = pageData.data.html;

    res.send(`
      <html>
        <head> <!-- Your head content here --> </head>
        <body>
           ${headerHtml}
           ${pageHtml}
        </body>
      </html>
    `);
  } else {
    res.status(404);
    res.send(/* Your 404 page HTML */);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
