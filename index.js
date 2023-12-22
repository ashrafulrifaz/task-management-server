const express = require('express')
const cors = require("cors")
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require("dotenv").config()
const app = express()
const port = process.env.PORT || 5000
console.log(process.env.SECRET_KEY,);

app.use(cors({
  origin: ['http://localhost:5173', 'https://tasky-5b815.web.app', 'https://tasky-5b815.firebaseapp.com'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const logger = async(req, res, next) => {
  console.log(req.method, req.url)
  next()
}

const verifyToken = async(req, res, next) => {
  const token = req?.cookies?.token
  if(!token){
    return res.status(401).send({message: 'unothorized access'})
  } 
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if(err) {
      return res.status(401).send({message: 'unothorized access'})
    } 
    req.user = decoded
    next()
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.klq4o7m.mongodb.net/?retryWrites=true&w=majority`;

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

      const taskCollection = client.db("taskyDB").collection("tasks")

      app.post('/jwt', async(req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '24h'})
        res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({result: true})
      })

      app.post('/logout', async(req, res) => {
        const user = req.body;
        res.clearCookie('token', {
          maxAge: 0, 
          sameSite: 'none', 
          secure: true
        }).send({success: true})
      })

      app.get('/tasks', logger, verifyToken, async(req, res) => {
          if(req.query?.email !== req.user?.email) {
            return res.status(403).send({message: 'forbidden access'})
         }
          let query = {email: req.query.email}
          if(req.query?.email){
            query = 
            console.log(req.query.email);
          }
          const result = await taskCollection.find(query).toArray()
          res.send(result)
      })

      app.get('/tasks/:id', logger, verifyToken, async(req, res) => {
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const result = await taskCollection.findOne(filter)
        res.send(result)
      })

      app.post('/tasks', logger, verifyToken, async(req, res) => {
        const task = req.body
        const result = await taskCollection.insertOne(task)
        res.send(result)
      })

      app.put('/tasks/:id', logger, verifyToken, async(req, res) => {
        const id = req.params.id
        const updateStatus = req.body;
        const filter = {_id: new ObjectId(id)}
        const newStatus = {
          $set: {
            status: updateStatus.status
          }
        }
        try {
          const result = await taskCollection.updateOne(filter, newStatus);
          res.send(result);
        } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
        }
      })

      app.delete('/tasks/:id', logger, verifyToken, async(req, res) => {
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const result = await taskCollection.deleteOne(filter)
        res.send(result)
      })

      // Send a ping to confirm a successful connection
      // await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   //  await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
