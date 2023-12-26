const express = require('express')
const cors = require("cors")
require("dotenv").config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

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

      app.get('/tasks', async(req, res) => {
          let query = {email: req.query.email}
          const result = await taskCollection.find(query).toArray()
          res.send(result)
      })

      app.get('/tasks/:id', async(req, res) => {
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const result = await taskCollection.findOne(filter)
        res.send(result)
      })

      app.post('/tasks', async(req, res) => {
        const task = req.body
        const result = await taskCollection.insertOne(task)
        res.send(result)
      })

      app.put('/tasks/:id', async(req, res) => {
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

      app.delete('/tasks/:id', async(req, res) => {
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
