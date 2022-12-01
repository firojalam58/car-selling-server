
const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config()



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

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
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




    }



    finally {

    }
}

run().catch(console.log())

app.get('/', async (req, res) => {
    res.send('car selling')
})


app.listen(port, () => console.log(`Car Selling running ${port}`))