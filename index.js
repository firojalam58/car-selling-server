
const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()




// middle were 
app.use(cors())
app.use(express.json())
// let jwt = require('jsonwebtoken');
// Mogodb Start 



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjrjkm4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

async function run() {
    try {
        const productsCollections = client.db('carProducta').collection('allProducts');
        const categoriesCollections = client.db('carProducta').collection('categories')
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

    }
    finally {

    }
}

run().catch(console.log())

app.get('/', async (req, res) => {
    res.send('car selling')
})


app.listen(port, () => console.log(`Car Selling running ${port}`))