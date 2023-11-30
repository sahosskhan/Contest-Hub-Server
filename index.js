const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
    const contestCollection = client.db("ContestHubDB").collection("Contest");
    const SubmitCollection = client.db("ContestHubDB").collection("Submit");
    const paymentsCollections = client.db("ContestHubDB").collection("Payments");
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
      jwt.verify(token, process.env.TOKEN, (err, decoded) => {
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
/// check creator permissions
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


    // use verify  after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    const verifyCreator = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isCreator = user?.role === 'creator';
      if (!isCreator) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
  

 
//user collection for admin
app.get("/users",verifyToken,verifyAdmin, async (req, res) => {
  const result = await userCollection.find().toArray();
  res.send(result);
});
//user collection for creator
app.get("/creator",verifyToken,verifyCreator, async (req, res) => {
  const result = await userCollection.find().toArray();
  res.send(result);
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
///submissions post
   app.post("/contestSubmission", async (req, res) => {
    try {
     const ContestSubmitAdd = req.body;
 const {id,pcount}=ContestSubmitAdd
     const result = await SubmitCollection.insertOne(ContestSubmitAdd);
     const filter = { _id: new ObjectId(id)};
     const options = { upsert: true };
     const updatedDoc ={
      $set: {
        pcount:(Number(pcount)+1).toString()
      }
     }
     const updated = await contestCollection.updateOne(filter, updatedDoc,options);
     res.send(result);
    }
     catch (error) {
       console.log(error);
     
    }
   });




   app.post("/add-contest", async (req, res) => {
    try {
     const ContestAdd = req.body;
     console.log(ContestAdd);
     const result = await contestCollection.insertOne(ContestAdd);
     res.send(result);
    }
     catch (error) {
       console.log(error);
     
    }
   });
   app.get("/added-contest", async (req, res) => {
    const result = await contestCollection.find().toArray();
    res.send(result);
  });
  app.get("/added-submission", async (req, res) => {
    const result = await SubmitCollection.find().toArray();
    res.send(result);
  });

  app.get("/submited-contest/:id", async (req, res) => {
    const id = req.params.id;
    const query = {_id :new ObjectId(id)}
    const result = await SubmitCollection.findOne(query);
    res.send(result);
  });

  app.delete("/contest-delete/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await contestCollection.deleteOne(query);
    res.send(result);
  });
  app.get("/contest-update/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await contestCollection.findOne(query);
    res.send(result);
  });

  app.get("/addedContestUser/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await contestCollection.findOne(query);
    res.send(result);
  });


  app.put("/updatedContest/:id", async (req, res) =>{
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updateContent = req.body;
    const content = {
      $set: {
        creatorName:updateContent.creatorName,
         creatorEmail:updateContent.creatorEmail,
         creatorImage:updateContent.creatorImage,
         status:updateContent.status,
         pcount:updateContent.pcount,
          nameContest:updateContent.nameContest,
          price:updateContent.price,
          money:updateContent.money,
          imageContest:updateContent.imageContest,
          tags:updateContent.tags,
          deadline:updateContent.deadline,
          description:updateContent.description, 
          submission:updateContent.submission,
      },
    };
    const result = await contestCollection.updateOne(
      filter,
      content,
      options
    );
    res.send(result);
  });


  app.patch("/contest-patch/:id",verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id)};
    const updatedDoc = {
      $set:{
        status: "approved",
      },
    }
    const result = await contestCollection.updateOne(filter,updatedDoc);
    console.log(result);
    res.send(result);
    
  });

  app.patch("/winner-patch/:id", async (req, res) => {
const {...data} = req.body
    console.log(data)
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        winingStatus: "winner",
      },
    };

    const result = await SubmitCollection.updateOne(filter,updatedDoc,options);
const filter2 = {_id: new ObjectId(data.id)}; 
const updatedDoc2 ={
  $set:{
    winingStatus: "winner",
winnerName: data.yourName,
winnerImage: data.yourImage,
  }
}
const result2 = await contestCollection.updateOne(filter2,updatedDoc2,options);
res.json({result, result2})
  });







   app.get("/community-post", async (req, res) => {
    const result = await CommunityCollection.find().toArray();
    res.send(result);
  });

  app.get("/user-list", async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
  });

 



  app.get("/user-list-update/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await userCollection.findOne(query);
    res.send(result);
  });
  app.put("/update-user-list/:id", async (req, res) =>{
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updateContent = req.body;
    const content = {
      $set: {
       name:updateContent.username,
       image: updateContent.userimage
      },
    };
    const result = await userCollection.updateOne(
      filter,
      content,
      options
    );
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
  app.post("/create-payment-intent",  async (req, res) => {
    const data = req.body;
    const price = data?.price;
    const amount = Number(price) * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: amount,
      payment_method_types: ["card"],
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });

  app.post("/payments",   async (req, res) => {
    const payment = req.body;
    const result = await paymentsCollections.insertOne(payment);
    const id = payment.id;
    const filter = { _id: new ObjectId(id) };
    const options = {upsert: true };
    const updatedDoc = {
      $set: {
        paymentStatus:"paid",
        transId: payment.transId,
      },
    };
    const updatedResult = await SubmitCollection.updateOne(
      filter,
      updatedDoc,
      options
    );
    res.send(result);
  });


    // await client.connect();

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
