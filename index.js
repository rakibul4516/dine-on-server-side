const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['https://dineon-aa210.web.app'],
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
        req.user = decoded;
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
        // await client.connect();

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
        

        //Post method for add foods
        app.post('/api/v1/foods', async (req, res) => {
            const food = req.body;
            const result = await foodsDatabase.insertOne(food)
            res.send(result)
        })
        //Patch method for update orders count
        app.put('/api/v1/foods/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const modifyData = req.body;
            const foods = {
                $set: {
                    orders: modifyData.orders,
                    quantity: modifyData.quantity,
                    foodName: modifyData.foodName,
                    image: modifyData.image,
                    category: modifyData.category,
                    price: modifyData.price,
                    origin: modifyData.origin,
                    desc: modifyData.desc
                }
            };
            const result = await foodsDatabase.updateOne(filter, foods, options)
            res.send(result)
        })


        //Post method for add foods
        app.post('/api/v1/users', async (req, res) => {
            const user = req.body;
            const result = await usersDatabase.insertOne(user)
            res.send(result)
        })

        //Get method for foods
        app.get('/api/v1/allfoods', async (req, res) => {
            //sorting data 

            //search functionality 
            const searchFood = req.query.search;
            const regex = new RegExp(searchFood, 'i');
            //Pagination 
            const page = Number(req.query.page)
            const limit = Number(req.query.limit)
            const skip = page * limit

            const cursor = foodsDatabase.find({ foodName: { $regex: regex } }).skip(skip).limit(limit);
            const result = await cursor.toArray()
            res.send(result)
        })
        // //Get method for foods
        app.get('/api/v1/countdata', async (req, res) => {
            const count = await foodsDatabase.estimatedDocumentCount();
            res.send({ count })
        })

        //Post method to get ordered foods

        app.post('/api/v1/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersDatabase.insertOne(order)
            res.send(result)
        })

        //Get method for my order foods
        app.get('/api/v1/myorders',verifyToken, async (req, res) => {
            const userEmail = req.query.email;
            const jwtEmail = req.user.email;
            if(userEmail!==jwtEmail){
                return res.status(403).send({message:'Forbidden Access'})
            }
            const query = { buyerEmail: userEmail }

            const cursor = ordersDatabase.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        
        //Delete my orders
        app.delete('/api/v1/myorders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await ordersDatabase.deleteOne(query)
            res.send(result)
        })



        //Get method using query
        app.get('/api/v1/foods', async (req, res) => {
            const userEmail = req.query.email;
            const query = { userEmail: userEmail }

            const cursor = foodsDatabase.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        
        //Get and Put method for update foods
        app.get('/api/v1/allfoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            console.log(query)
            const result = await foodsDatabase.findOne(query);
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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