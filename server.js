const express = require('express');
const http = require('http');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const server = http.createServer(app);



// Connect Mongodb
mongoose.connect('mongodb://localhost/secureDatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Initialize session
const store = new MongoDBStore({
    uri: 'mongodb://localhost/secureDatabase',
    collection: 'sessions',
});

//express middleware
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

//Mongoose user schema and model 
const User = mongoose.model('User', {
    username: String,
    password: String,
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});



//connect HTML files for registration and login directly from the "views" directory
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            password: hashedPassword,
        });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Registration failed.');
    }

});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
        return res.status(401).send('Username or password is incorrect');
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);

    if (!validPassword) {
        return res.status(401).send('Username or password is incorrect');
    }

    req.session.user = user; //Store user data in session
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    console.log(req.session.user)
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.sendFile(path.join(__dirname, 'public', 'TravelPlanner.html'));
});





// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));





server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
