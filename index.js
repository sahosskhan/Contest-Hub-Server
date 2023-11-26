const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

//middleware config
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const userCollection = client.db("ContestHubDB").collection("Users");
//jwt crate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN, { expiresIn: "2h" });
      res.send({ token });
    });


    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.Token, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

///check admin
app.get("/users/admin/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  const query = { email: email };
  const user = await userCollection.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === "admin";
  }
  res.send({ admin });
});

app.get("/users/creator/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  const query = { email: email };
  const user = await userCollection.findOne(query);
  let creator= false;
  if (user) {
    creator = user?.role === "creator";
  }
  res.send({ creator });
});

app.get("/users/user/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  const query = { email: email };
  const user = await userCollection.findOne(query);
  let useR= false;
  if (user) {
    useR = user?.role === "useR";
  }
  res.send({ useR });
});







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
  //user collection
  app.get("/users",verifyToken, async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
  });

  // make admin
  app.patch("/users/admin/:id", verifyToken, async  (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        role: "admin",
      },
    };
    const result = await userCollection.updateOne(filter, updatedDoc);
    res.send(result);
  });
///make creator
  app.patch("/users/creator/:id", verifyToken, async  (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        role: "creator",
      },
    };
    const result = await userCollection.updateOne(filter, updatedDoc);
    res.send(result);
  });
///make user
  app.patch("/users/user/:id", verifyToken, async  (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        role: "user",
      },
    };
    const result = await userCollection.updateOne(filter, updatedDoc);
    res.send(result);
  });

  app.post("/users", async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: "User already exists", insertedInd: null });
    }
    const result = await userCollection.insertOne(user);
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
