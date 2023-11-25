const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

//middleware config
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x63gjwg.mongodb.net/?retryWrites=true&w=majority`;

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

    const CommunityCollection = client.db("ContestHubDB").collection("Community");
//add community post
app.post("/add-community-post", async (req, res) => {
    try {
     const PostAdd = req.body;
     console.log(PostAdd);
     const result = await CommunityCollection.insertOne(PostAdd);
     res.send(result);
    }
     catch (error) {
       console.log(error);
     
    }
   });

   app.get("/community-post", async (req, res) => {
    const result = await CommunityCollection.find().toArray();
    res.send(result);
  });


    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
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
    res.send('🎯 Welcome to Contest Hub Server🗄️')
  })
  
  app.listen(port, () => {
    console.log(`Contest Hub is working on port ${port}`);
  })
