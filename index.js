require('./db/config')
const express = require('express')
const cors = require("cors");
const User = require('./db/User');
const Note = require('./db/Note')
const Jwt = require('jsonwebtoken');
const jwtKey = 'codegestures';
const app = express();

app.use(express.json());
app.use(cors());

// User 

function PasswordValidation(password) {
    const lower = new RegExp('(?=.*[a-z])');
    const upper = new RegExp('(?=.*[A-Z])');
    const number = new RegExp('(?=.*[0-9])');
    const special = new RegExp('(?=.*[!@#\$%\^&\*])');
    const length = new RegExp('(?=.{8,})')

    return ((lower.test(password)) && (upper.test(password)) && (number.test(password)) && (special.test(password)) && (length.test(password)));
}

app.post("/register", async (req, resp) => {
    try {
        if(PasswordValidation(req.body.password)) {
            let user = new User(req.body);
            let result = await user.save();
            result = result.toObject();
            delete result.password
            Jwt.sign({result}, jwtKey, {expiresIn:"2h"},(err,token)=>{
                if(err){
                    resp.send(err)  
                }
                resp.send({success: true, result, auth:token})
            })
        }
        else {
            resp.send({error: "Password Validation Failed!"})
        }
    } catch (error) {
        resp.send({status: false, errorAt: error.keyPattern})
    }
})

app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.mobile) {
        let user = await User.findOne(req.body).select("-password");

        if (user) {
            Jwt.sign({user}, jwtKey, {expiresIn:"2h"},(err,token)=>{
                if(err){
                    resp.send( "Something went wrong" )  
                }
                resp.send({user, auth:token})
            })
        } 

        else {
            resp.send({ result: "No User found" })
        }
    } 
    
    else {
        resp.send({ result: "No User found" })
    }
});

app.get("/users", async (req, resp) => {
    const users = await User.find();
    if (users.length > 0) {
        resp.send(users)
    } else {
        resp.send({ result: "No User found" })
    }
});

app.put("/user/:id", async (req, resp) => {
    let result = await User.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    resp.send(result)
});

app.delete("/user/:id", async (req, resp) => {
    let result = await User.deleteOne({ _id: req.params.id });
    resp.send(result)
})

app.post("/user", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    resp.send(result);
});

app.get("/searchUser/:key", async (req, resp) => {
    let searchQuery = req.params.key;

    let result = await User.find({
        "$or": [
            {
                name: { $regex: `^${searchQuery}`, $options: 'i' }        
            }, 
            {
                position: { $regex: `^${searchQuery}`, $options: 'i' }  
            }
        ]
    });
    resp.send(result);
})

app.get("/profile-from-id/:id", async (req, resp) => {
    let result = await User.findOne({_id: req.params.id});
    
    if(result) {
        resp.send(result);
    }
    else {
        resp.send({result: "No user found!"})
    }
})

app.put("/profile/:id", async (req, resp) => {
    let result = await User.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    resp.send(result)
});

// Notes

app.post("/add-note", async (req, resp) => {
    let note = new Note(req.body);
    let result = await note.save();
    resp.send(result);
});

app.get("/notes", async (req, resp) => {
    const notes = await Note.find();
    if (notes.length > 0) {
        resp.send(notes)
    } else {
        resp.send({ result: "No Product found" })
    }
});

app.get("/note-from-id/:id", async (req, resp) => {
    let result = await Note.findByIdAndUpdate(req.params.id, { $inc: {views: 1}});

    const updatedComments = result.comments.map(async (comment) => {
        const name = await User.findById(comment.userId).select('name');
        return { ...comment.toObject(), name: name.name };
    });

    const updatedNote = { ...result.toObject(), comments: await Promise.all(updatedComments) };
    
    if (result) {
        resp.send(updatedNote);
    } else {
        resp.send({ "result": "No Record Found." })
    }
})

app.put("/note/:id", async (req, resp) => {
    let result = await Note.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )

    resp.send(result)
});

app.put("/update-view/:id", async (req, resp)=>{
    let result = await Note.updateOne(
        {_id: req.params.id},
        {$set: req.body}
    )

    resp.send(result)
})

app.delete("/note/:id", async (req, resp) => {
    let result = await Note.deleteOne({ _id: req.params.id });
    resp.send(result)
})

app.get("/views-sorted-note", async (req, resp)=>{
    let result = await Note.find().sort({views: -1});

    if(result) {
        resp.send(result)
    }
    else {
        resp.send({result:"No note found"})
    }
})

app.get("/comment-sorted-note", async (req, resp)=>{
    let result = await Note.find({});
    result.sort((a, b)=> b.comments.length - a.comments.length);

    if(result) {
        resp.send(result)
    }
    else {
        resp.send({result:"No note found"})
    }
})

app.get("/like-sorted-note", async (req, resp)=>{
    let result = await Note.find();
    result.sort((a, b)=>b.likes.length - a.likes.length);

    if(result) {
        resp.send(result)
    }
    else {
        resp.send({result:"No note found"})
    }
})

app.get("/get-sorted-note/:id", async (req, resp) => {
    if(req.params.id == 1) {
        let result = await Note.find();
        result.reverse();

        if(result) {
            resp.send(result)
        }
        else {
            resp.send({result: "No note found"})
        }
    }
    else if(req.params.id == 2) {
        let result = await Note.find();
        result.sort((a, b)=>b.likes.length - a.likes.length);

        if(result) {
            resp.send(result)
        }
        else {
            resp.send({result:"No note found"})
        }   
    }
    else if(req.params.id == 3) {
        let result = await Note.find();
        result.sort((a, b)=>b.comments.length - a.comments.length);

        if(result) {
            resp.send(result)
        }
        else {
            resp.send({result:"No note found"})
        } 
    }
    else if(req.params.id == 4) {
        let result = await Note.find().sort({views: -1});

        if(result) {
            resp.send(result)
        }
        else {
            resp.send({result:"No note found"})
        } 
    }
    else {
        resp.send({result: "No Note Exist!"})
    }
})

app.post("/add-comment/:id", async (req, resp) => {
    let note = await Note.findById(req.params.id);

    if(note) {
        note.comments.push({
            userId: req.body.userId,
            comment: req.body.comment
        });

        let result = await note.save();

        if(result) {
            resp.send(result)
        }
        else {
            resp.send({result: "Comment have not been added!"})
        }
    }

    else {
        resp.send({result: "No Note Exist!"})
    }
})

app.put('/like/:id', async (req, resp) => {
    let note = await Note.findById(req.params.id);

    if(note) {
        let userId = req.body.userId;
        const isLiked = note.likes.find(like => like.userId === userId);

        if(isLiked) {
            note.likes = note.likes.filter(like => like.userId !== userId);
        }
        else {
            note.likes.push({ userId });
        }

        let result = await note.save();
        resp.send(result)
    }
    else {
        resp.send({result: "No Note Exist!"})
    }
})

// Dashboard

app.get('/user-count', async (req, resp)=>{
    let result = await User.find();
    let len = result.filter(x => x["employee"] != true && x["admin"] != true).length;

    if(len > 0) {
        resp.send({length: len})
    }
    else {
        resp.send({result: "No user found!"})
    }
})

app.get('/employee-count', async (req, resp)=>{
    let result = await User.find();
    let len = result.filter(x => x["employee"] != false && x["admin"] != true).length;

    if(len > 0) {
        resp.send({length: len})
    }
    else {
        resp.send({result: "No user found!"})
    }
})

app.get('/note-count', async (req, resp)=>{
    let result = await Note.find();

    if(result.length > 0) {
        let len = result.length
        resp.send({length: len})
    }
    else {
        resp.send({result: "No note found!"})
    }
})

app.get("/search/:key", async (req, resp) => {
    let searchQuery = req.params.key;

    let result = await Note.find({
        "$or": [
            {
                title: { $regex: `^${searchQuery}`, $options: 'i' }        
            }, 
            {
                uploadedOn: { $regex: `^${searchQuery}`, $options: 'i' }  
            }
        ]
    });
    resp.send(result);
})


app.listen(5000)