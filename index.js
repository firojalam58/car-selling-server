
const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');
const app = express()
require('dotenv').config()




// middle were 
app.use(cors())
app.use(express.json())
// Mogodb Start 



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjrjkm4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

async function run() {
    try {
        const productsCollections = client.db('carProducta').collection('allProducts');
        const categoriesCollections = client.db('carProducta').collection('categories');
        const bookingCollections = client.db('carProducta').collection('bookings');
        const usersCollection = client.db('carProducta').collection('users')
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
        app.get('/addproducts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = await productsCollections.find(query).toArray();
            res.send(cursor);
        })

        // add Product api setup
        app.post('/addproducts', async (req, res) => {
            const ProductAdd = req.body;
            const result = await productsCollections.insertOne(ProductAdd);
            res.send(result)
        });

        app.delete('/addproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productsCollections.deleteOne(query);
            res.send(result)
        });

        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email }
        //     const user = await usersCollection.findOne(query);
        //     res.send({ isAdmin: user?.role === 'buyer' });
        // })

    }
    finally {

    }
}

run().catch(console.log())

app.get('/', async (req, res) => {
    res.send('car selling')
})


app.listen(port, () => console.log(`Car Selling running ${port}`))