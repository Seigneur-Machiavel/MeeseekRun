const express = require('express');
const app = express();
const port = 4322;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/MeeseekRun', express.static('public'));

app.get('/', (req, res) => {res.render('index');});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});