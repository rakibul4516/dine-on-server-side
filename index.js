const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



app.get('/',(req,res)=>{
    res.send('DineOn server is running')
});


app.listen(port,()=>{
    console.log(`DineOn server is running on port no: ${port}`)
})