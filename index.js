
const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



// middle were 
app.use(cors())
app.use(express.json())
// Mogodb Start 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({message:'Unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, 
        function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjrjkm4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

async function run() {
    try {
        const productsCollections = client.db('carProducta').collection('allProducts');
        const categoriesCollections = client.db('carProducta').collection('categories');
        const bookingCollections = client.db('carProducta').collection('bookings');
        const usersCollection = client.db('carProducta').collection('users')
        const paymentCollection = client.db('carProducta').collection('payment')

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '5d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next();
        }

        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollections.find(query).toArray()
            res.send(products)
        });

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoriesCollections.find(query).toArray()
            res.send(result)
        })

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const category = await categoriesCollections.findOne(filter);
            const query = { category: category.category };
            const result = await productsCollections.find(query).toArray();
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10days' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: 'token' })
        });


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await productsCollections.findOne(query)
            res.send(service)
        });

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = await bookingCollections.find(query).toArray();
            res.send(cursor);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollections.insertOne(booking);
            res.send(result)
        });
        app.post('/products', async (req, res) => {
            const ProductAdd = req.body;
            const result = await productsCollections.insertOne(ProductAdd);
            res.send(result)
        });
        app.post('/products', async (req, res) => {
            const productInfo = req.body;
            const addProduct = await productsCollections.insertOne(productInfo);
            res.send(addProduct);
        })
        app.get('/addproducts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = await productsCollections.find(query).toArray();
            res.send(cursor);
        })
// payment

app.post('/create-payment-intent', async (req, res) => {
    const booking = req.body;
    const price = booking.price;
    const amount = price * 100;

    const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        "payment_method_types": [
            "card"
        ]
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

app.post('/payments', async (req, res) => {
    const payment = req.body;
    const result = await paymentCollection.insertOne(payment);
    const id = payment.bookingId;
    const filter = { _id: ObjectId(id) }
    const updatedDoc = {
        $set: {
            paid: true,
            transactionId: payment.transactionId,
            advertise: false
        }
    }
    const updatedResult = await bookingCollections.updateOne(filter, updatedDoc);
    const productUpdate = await productsCollections.updateOne(filter,updatedDoc)
    res.send(result);
})
app.post('/create-payment-intent', async (req, res) => {
    const booking = req.body;
    const price = booking.price;
    const amount = price * 100;
    const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount,
        'payment_method_types': [
            'card'
        ]
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

//for booking payment
app.get('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await bookingCollections.findOne(query);
    res.send(result)
})


        
        //  for all sellers
        app.get('/allsellers', async (req, res) => {
            const query = { role: "Seller" };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        })

        app.get('/allsellers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result);

        });
        app.delete('/allsellers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);

        });
        app.put('/reportproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const option = {upsert:true};
            const updateDoc = {
                $set:{
                    report:true
                }
            }
            const result = await productsCollections.updateOne(query,updateDoc,option);
            res.send(result);

        });
        app.get('/reportproduct',async (req, res)=>{
            const query = {report:true}
            const result = await productsCollections.find(query).toArray()
            res.send(result)
        })
        app.delete('/reportproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollections.deleteOne(query);
            res.send(result);

        });
        app.put('/advertiseproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const option = {upsert:true};
            const updateDoc = {
                $set:{
                    advertise:true
                }
            }
            const result = await productsCollections.updateOne(query,updateDoc,option);
            res.send(result);

        });
        app.get('/advertiseproduct', async (req, res)=>{
            const query = {advertise:true}
            const result = await productsCollections.find(query).toArray();
            res.send(result)
        })

        app.put('/allsellers/verify/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const option = {upsert:true};
            const updateDoc = {
                $set:{
                    verify:true
                }
            }
            const result = await usersCollection.updateOne(query,updateDoc,option);
            res.send(result);

        });
        app.get('/allbuyers', async (req, res) => {
            const query = {role: 'Buyer'};
            const result = await usersCollection.find(query).toArray();
            res.send(result);

        });

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            if(user.role === 'Admin'){
              return  res.send(user);
            }
            res.status(401).send({message: 'Unauthorize Access'})
        });


//admin route
app.get('/users/admin/:email', async(req, res)=>{
    const email = req.params.email;
    const query = {email: email};
    const result = await usersCollection.findOne(query);
    res.send({isAdmin: result?.role === 'Admin'});
});

//seller route
app.get('/users/seller/:email', async(req, res)=>{
    const email = req.params.email;
    const query = {email: email};
    const result = await usersCollection.findOne(query);
    res.send({isSeller: result?.role === 'Seller'});
})

//buyer route
app.get('/users/buyer/:email', async(req, res)=>{
    const email = req.params.email;
    const query = {email: email};
    const result = await usersCollection.findOne(query);
    res.send({isBuyer: result?.role === 'Buyer'});
})


    }



    finally {

    }
}

run().catch(console.log())

app.get('/', async (req, res) => {
    res.send('car selling')
})


app.listen(port, () => console.log(`Car Selling running ${port}`))