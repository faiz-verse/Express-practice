const express = require('express');
const app = express();
let users = [];
const fs = require('fs'); // for file operations
const path = require('path'); // for path operations

const PORT = process.env.PORT || 3000;

// ✅ Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));
// ✅ Middleware to take body content as a json for every req and res
app.use(express.json());
// ✅ Middleware to load the users everytime the req or response is made
app.use((req, res, next)=>{
    const data = fs.readFileSync(path.join(__dirname, 'MOCK_DATA.json'), 'utf-8', (err, html) => {
        if(err){
            return res.status(400).json({message: 'Unable to read existing users!'})
        }
    })
    users = JSON.parse(data)
    next()
})

// ✅ Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public'))); // This serves files inside "public" folder

// ✅ Home page
app.get('/', (req, res) => {
    const originalHtml = fs.readFileSync(path.join(__dirname,'index.html'),'utf-8',(err,html) => {
        if(err) console.log("Error occured while reading the html file: ", err)
    });
    return res.send(originalHtml)
})

// ✅ Api to send the users in response
app.get('/api/users', (req, res) => {
    // sending users as json response
    return res.status(200).json(users)
})

// ✅ Api to add the user in json file
app.post('/api/users/add', (req, res) => {
    if(req.body.first_name === "" || req.body.last_name === "" || req.body.email === "" || req.body.gender === ""){
        console.error("Some fields are empty!");
        return res.status(400).json({success: false, message: "❌ ERROR adding user | Some fields are empty!"});
    }
    console.log(`User being added: \n${JSON.stringify(req.body)}`)
    users = [...users, {id: users.length + 1, ...req.body}]
    // Convert the object to a formatted JSON string
    const jsonData = JSON.stringify(users, null, 2);
    try {
        fs.writeFileSync(path.join(__dirname, 'MOCK_DATA.json'), jsonData, 'utf-8');
        return res.status(201).json({success: true, message: "✅ Success adding user", users: users});
    } catch (err) {
        console.error("Error writing to JSON file:", err);
        return res.status(500).json({success: false, message: "❌ ERROR adding user | Unable to write user entry into .json file"});
    }
})

// ✅ API to search for users dynamically
app.get('/api/users/search', (req, res) => {
    let searchUser = users; // Start with all users

    if (req.query.id) {
        const id = Number(req.query.id);
        searchUser = searchUser.filter(user => String(user.id).includes(id));
    }
    if (req.query.first_name) {
        const first_name = req.query.first_name.toLowerCase();
        searchUser = searchUser.filter(user => user.first_name.toLowerCase().includes(first_name));
    }
    if (req.query.last_name) {
        const last_name = req.query.last_name.toLowerCase();
        searchUser = searchUser.filter(user => user.last_name.toLowerCase().includes(last_name));
    }
    if (req.query.email) {
        const email = req.query.email.toLowerCase();
        searchUser = searchUser.filter(user => user.email.toLowerCase().includes(email));
    }
    if (req.query.gender) {
        const gender = req.query.gender.toLowerCase();
        searchUser = searchUser.filter(user => user.gender.toLowerCase().includes(gender));
    }

    // Handle no results
    if (searchUser.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Users not found! ❌",
            users: []
        });
    }

    // Success response
    return res.status(200).json({
        success: true,
        message: "Users found! ✅",
        users: searchUser
    });
});

// ✅ Api to Delete the user
app.delete('/api/users/delete/:id', (req, res) => {
    const userId = Number(req.params.id);
    const index = users.findIndex((user) => user.id === userId)
    if (index === -1) {
        return res.status(404).json({ success: false, message: "User not found ❌", users: []});
    }
    users.splice(index, 1) //splice is used to remove elements (here 1 element at index will be removed)
    // changing ids
    users.forEach((user, index) => {
        user.id = index + 1;
    })
    // writing change to json file
    fs.writeFileSync(path.join(__dirname, 'MOCK_DATA.json'), JSON.stringify(users, null, 2));
    return res.status(200).json({ success: true, message: "User deleted successfully ✅", users: users});
})

// ✅ Api to Edit the User
// to send the user data to form for pre fill
app.get("/api/users/edit/:id", (req, res) => {
    const userId = Number(req.params.id)
    const userToEdit = users.find((user) => user.id === userId)
    return res.status(200).json({success: true, message: "User found to edit ✅", user: userToEdit})
})
// to update the user data
app.put("/api/users/edit/:id", (req, res) => {
    const userId = Number(req.params.id)
    const updatedUserData = req.body;
    const userIndex = users.findIndex((user) => user.id === userId);
    console.log(userId)
    if (userIndex !== -1) {
        // 🔥 Update only that index
        users[userIndex] = { ...users[userIndex], ...updatedUserData };
        // writing change to json file
        fs.writeFileSync(path.join(__dirname, 'MOCK_DATA.json'), JSON.stringify(users, null, 2));
        return res.status(200).json({ success: true, message: "User updated successfully ✅", users: users});
    } else {
        return res.status(404).json({ success: false, message: "User not found ❌" });
    }
})

app.listen(PORT, ()=>{
    console.log("Server listening on port: ", PORT)
})