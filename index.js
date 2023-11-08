const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())

// token verify
const verifyToken = (req,res,next) =>{
    const token = req?.cookies?.token;
    if(!token){
        return res.status(401).send({message:'unauthorized access'})
    }
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
        if(err){
            return res.status(401).send({message:'unauthorized access'})
        }
        res.user = decoded;
        next()
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ufdhagf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //Databases
        const usersDatabase = client.db('DineOn').collection('users')
        const foodsDatabase = client.db('DineOn').collection('foods')
        const ordersDatabase = client.db('DineOn').collection('orders')

        app.post('/api/v1/jwt', async (req, res) => {
            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
            console.log(token)
            res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true })
        })

        app.post('/api/v1/logout',async(req,res)=>{
            const user = req.body;
            console.log('logout user',user)
            res.clearCookie('token',{maxAge:0}).send({success:true})
        })
        





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('DineOn server is running')
});


app.listen(port, () => {
    console.log(`DineOn server is running on port no: ${port}`)
})