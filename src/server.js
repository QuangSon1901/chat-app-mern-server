const express = require('express');
const app = express();

const PORT = process.env.APP_PORT || 4000;

app.get('/', (req, res) => {
    res.send('oke');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
