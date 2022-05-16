const express = require('express');
const axios = require('axios');

const app = express();
// TODO: Replace with your Builder public API key
const apiKey = 'YOUR_API_KEY';
const port = 3000;

const handleError = err => {
  // Builder did not match a section
  if (err.response.status === 404) {
    return { data: null };
  }
  throw err;
};

app.get('*', async (req, res) => {
  const encodedUrl = encodeURIComponent(req.url);
  const { data: headerData } = await axios
    .get(`https://cdn.builder.io/api/v1/html/section?apiKey=${apiKey}&userAttributes.name=Header`)
    .catch(handleError);

  if (headerData ) {
    const headerHtml = headerData.data.html;

    res.send(`
      <html>
        <head> <!-- Your head content here --> </head>
        <body>
           <!-- Your header here -->
           ${headerHtml}
           <h1>I did it!</h1>
           <!-- Your footer here -->
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
