
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const cookieParser = require('cookie-parser')
const cors = require('cors')
const multer  = require("multer");
const fs = require('fs')
const path = require('path')
/*const mongoose = require("mongoose")*/
let brain = require('brain.js');
let net =  new brain.NeuralNetwork();
net.fromJSON(require('./data/mnistTrain'));
const PORT = process.env.PORT || 3001

const avatarArray = ["https://memepedia.ru/wp-content/uploads/2016/07/GaecXsgZG8Y.jpg","https://www.meme-arsenal.com/memes/049799fd8f36365270444d2aa48de122.jpg",
    "https://avatars.mds.yandex.net/get-zen_doc/1945572/pub_5d6df7efbf50d500ae1fe15e_5d6df8298c5be800aff354a9/scale_1200","https://www.meme-arsenal.com/memes/8c39f83458ca87b0b75cea622c6b096d.jpg",
    "https://www.meme-arsenal.com/memes/16c4c9eab23ca0109de7ac7b71b8b19c.jpg","https://www.meme-arsenal.com/memes/8f6ef860ea398123ec96658a0808e33d.jpg"]

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "uploads");
    },
    filename: (req, file, cb) =>{
       // cb(null, file.originalname);

        cb(null,  Date.now() + file.originalname);
    }
});


app.use(bodyParser.json({limit: '50mb'}));
//app.use(bodyParser.urlencoded({extended: true},{limit: '50mb'}));

app.use(bodyParser.urlencoded({limit: '50mb',extended: true}));

app.use(cors({
    origin: "https://apepe.surge.sh",//'http://localhost:3000', //'http://localhost:3002' //https://apepe.surge.sh
    "Access-Control-Allow-Origin": '*',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
}))
app.use(cookieParser())
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const upload = multer({dest:"uploads",storage:storageConfig});

app.use(express.static(__dirname));
//app.use(multer({dest:"uploads"}).single("filedata"));
/*const { MongoClient, ObjectId } = require('mongodb');*/
let db

let arrayOnlineUsers = []


const CheckOnlineFun = () =>{
    const collection = db.collection("users");
    let nowDate = Date.now()
    for(let i = 0; i < arrayOnlineUsers.length; i++){
        if( nowDate - arrayOnlineUsers[i].time > 120000){
            collection.findOneAndUpdate({_id: ObjectId(arrayOnlineUsers[i].id)},{$set: {online: false}}, function(err, check){
                if(err) return console.log(err);
            })
            arrayOnlineUsers.splice(i,1)
        }
    }
    console.log(arrayOnlineUsers)
}

setInterval(CheckOnlineFun, 120000);

app.get('/onlineCheck/:userId', function (req,res) {
    let nowDate = Date.now()
    let check = true
    for(let i = 0; i < arrayOnlineUsers.length; i++){
        if(arrayOnlineUsers[i].id == req.params.userId){
            arrayOnlineUsers[i].time = nowDate
            check = false
        }
    }
    if(check){
        let obj = {
            id: req.params.userId,
            time: nowDate
        }
        arrayOnlineUsers.push(obj)
    }
    res.send(".")
})




app.get('/user/:userId', function (req,res) {
    const collection = req.app.locals.collection.collection("users");
    let id = Number(req.params.userId)
    collection.find({id: id}).toArray(function(err, user){
        res.send(user)
    })

})

app.post('/LoginIn', function (req,res) {

    const collection = req.app.locals.collection.collection("users");
    collection.findOne({login: req.body.login}, function(err, user){
        if(err) return console.log(err);

        if(user){
            if(req.body.password === user.password){
                res.send({check: true, user: user})
            }else {
                res.send({check: false, err: 'Неправильный пароль'})
            }
        }else{
            res.send({check: false, err: 'Такого пользователя не существует'})
        }
    })

})




app.post('/cookie', function (req,res) {

    const collection = req.app.locals.collection.collection("users");
    collection.findOne({login: req.body.login}, function(err, user){
        if(err) return console.log(err);

        if(user){
            if(req.body.password === user.password){
                let check = true
                let obj = {
                    id: user._id,
                    time: Date.now()
                }
                for(let i = 0; i < arrayOnlineUsers.length; i++){
                    if(arrayOnlineUsers[i].id == user._id){
                        arrayOnlineUsers[i].time = Date.now()
                        check = false
                    }
                }
                if(check){
                    arrayOnlineUsers.push(obj)
                }

                res.send({check: true, user: user})

            }else {
                res.send({check: false, login: req.body.login})
            }
        }else{
            res.send({check: false})
        }
    })
})

/*app.get('/LoginOut', function (req,res) {
    res.clearCookie('password')
    res.send('Clear cookie')
})*/

app.post('/registration', (req, res) => {
    let check = false
    const collection = req.app.locals.collection.collection("users");
    collection.findOne({login: req.body.login}, function(err, login){
        if(login) {
            check = true
            res.send({check: false, err: "Логин занят"})
        }
        collection.findOne({email: req.body.email}, function(err, email){
            if(email) {
                check = true
                res.send({check: false, err: "Такая почта уже зарегестрированна"})
            }
            if(!check){
                let user = {
                    id: Math.round(Math.random()*10000000000),
                    name: req.body.name,
                    lastName: req.body.lastName,
                    stringName: req.body.name + " " + req.body.lastName,
                    online: true,
                    birthday: 1619032458843,
                    avatar: avatarArray[Math.floor(Math.random() * avatarArray.length)],
                    login: req.body.login,
                    password: req.body.password,
                    friend: [],
                    email: req.body.email,
                    background: {
                        url: "https://cdn.igromania.ru/mnt/news/c/5/a/d/4/0/74239/f1332090f94100aa_1200xH.jpg",
                        repeatBackground: false
                    },
                    notification: {
                        countNotification: 0,
                        arrayNotification: []
                    }
                }
                collection.insertOne(user, function (err, results) {
                    if(err) return res.send({check: false, err: "Не удалось зарегестрировать"})

                    res.send({check: true,user: user})
                    /*console.log(results.ops[0]._id)*/ // возращаем id
                    let post2 = {
                        userID: results.ops[0]._id,
                        mainPagePost: [],
                        branchPost: []
                    }
                    let postCollection = req.app.locals.collection.collection("post");
                    postCollection.insertOne(post2, function (err, results) {
                        if (err) return console.log(err)
                    })
                })
            }
        })
    })
})

app.get('/setOnline/:userId/:check', function (req,res) {
    let check = false
    if(req.params.check == "true"){
        check = true
    }
    const collection = req.app.locals.collection.collection("users");
    collection.findOneAndUpdate({_id: ObjectId(req.params.userId)},{$set: {online: check}}, function(err, check){
        if(err) return console.log(err);
        res.send(true)
    })
})



app.get('/getPost/:id', function (req,res) {

    const collection = req.app.locals.collection.collection("post");
    collection.findOne({userID: ObjectId(req.params.id)}, function (err, post) {
        if(err) return console.log(err)
        res.send(post)
    })
})
/*app.get('/getPostIndex/:userId/:postId', function (req,res) {
    //console.log(req.params)
    const collection = req.app.locals.collection.collection("post");
    collection.findOne({userID: ObjectId(req.params.id)}, function (err, post) {
        if(err) return console.log(err)
        res.send(post)
    })
})*/
app.get('/getUser/:id', function (req,res) {
    //console.log(req.params)
    const collection = req.app.locals.collection.collection("users");
    collection.findOne({_id: ObjectId(req.params.id)}, function (err, user) {
        if(err) return console.log(err)
        let mainUserInf = {
            _id: user._id,
            name: user.name,
            lastName: user.lastName,
            online: user.online,
            avatar: user.avatar,
            background: {
                url: user.background.url,
                repeatBackground: user.background.repeatBackground
            }
        }
        res.send(mainUserInf)
    })
})

app.post('/setPost/:id', function (req,res) {
    const collection = req.app.locals.collection.collection("post");
    collection.findOneAndUpdate({userID: ObjectId(req.params.id)}, {$push: {mainPagePost: req.body.post}},
       function (err, post) {
        if(err) return console.log(err)
        res.send(req.body.post)
    })
})




app.post('/setBranchPost/:userId/:postId', function (req,res) { //пост в ветку
    const collection = req.app.locals.collection.collection("branchPost");

    collection.findOneAndUpdate({userId: req.params.userId,postId: req.params.postId}, {$push: {"branchPosts": req.body.post}},
        function (err, post) {
            if(err) return console.log(err)
            console.log(req.body.post.senderID)
            if(post.value == null){
                let newPost = {
                    userId: req.params.userId,
                    postId: req.params.postId,
                    branchPosts: [
                        req.body.post
                    ]
                }
                collection.insertOne(newPost,function (err,data) {
                    if(err) return console.log(err)
                    //res.send(req.body.post)
                })
            }

            if(req.body.post.senderID !== req.params.userId){
                const userCollection = req.app.locals.collection.collection("users");
                userCollection.findOne({_id: ObjectId(req.body.post.senderID)},function (err, user) {
                    if (err) return console.log(err)
                    let object
                    if(req.body.post.answerCheck){
                        object = {
                            type: "answer",
                            name: user.name,
                            lastName:  user.lastName,
                            date: Date.now(),
                            id: req.params.userId,
                            idPost: req.body.post.mainPostId,
                            idHost: req.body.post.senderID
                        }
                        userCollection.findOneAndUpdate({_id: ObjectId(req.body.post.answerUserId)}, {$push: {"notification.arrayNotification":object},$inc: {"notification.countNotification":1}},
                            function (err, user2) {
                                if (err) return console.log(err)
                                // res.send({check: true})
                            })
                    }
                        object = {
                            type: "comment",
                            name: user.name,
                            lastName:  user.lastName,
                            date: Date.now(),
                            id: req.params.userId,
                            idPost: req.body.post.mainPostId
                        }


                    userCollection.findOneAndUpdate({_id: ObjectId(req.params.userId)}, {$push: {"notification.arrayNotification":object},$inc: {"notification.countNotification":1}},
                        function (err, user2) {
                            if (err) return console.log(err)
                            // res.send({check: true})
                        })


                })
            }




            res.send(req.body.post)
        })

})

app.get('/countMainPost/:userId/:postId', function (req,res) {
    const collection = req.app.locals.collection.collection("post");
    let postIdNumber = Number(req.params.postId)

    collection.updateMany({userID: ObjectId(req.params.userId)},
        {
            $inc : {"mainPagePost.$[elem].countAnswer": 1}
        },
        { arrayFilters: [{"elem.id": postIdNumber}] },
        function (err, data) {
            if (err) return console.log(err)
            res.send(data)
        })
})


app.get('/getBranchPost/:userId/:postId', function (req,res) {
    //console.log(req.params)
    const collection = req.app.locals.collection.collection("branchPost");
    collection.findOne({userId:  req.params.userId, postId: req.params.postId }, function (err, posts) {
        if(err) return console.log(err)
        if(posts){
            let arrIdSender = []
            let arrIdAnswer = []
            for(let i = 0; i < posts.branchPosts.length; i++){
                let flag = true
                let answerFlag = true
                for(let j = 0; j < i; j++){
                    if(posts.branchPosts[i].senderID == posts.branchPosts[j].senderID){
                        flag = false
                    }
                    if(posts.branchPosts[i].answerUserId == posts.branchPosts[j].answerUserId){
                        answerFlag = false
                    }
                }
                if(flag){
                    arrIdSender.push( ObjectId(posts.branchPosts[i].senderID))
                }
                if(answerFlag){
                    arrIdAnswer.push( ObjectId(posts.branchPosts[i].answerUserId))
                }
            }

            const userCollection = req.app.locals.collection.collection("users");
            userCollection.find({
                _id : {$in: arrIdSender}
            }).toArray(function(err, users) {
                userCollection.find({
                    _id : {$in: arrIdAnswer}
                }).toArray(function(err, usersAnswer) {
                    let sendObject = []
                    for(let i = 0; i < posts.branchPosts.length;i++) {
                        let newObject
                        if(posts.branchPosts[i].answerCheck){
                            for(let j = 0; j < users.length;j++) {
                                if (posts.branchPosts[i].senderID == users[j]._id) {
                                    for(let g = 0; g < usersAnswer.length;g++) {
                                        if (posts.branchPosts[i].answerUserId == usersAnswer[g]._id) {
                                            newObject =  {
                                                id: posts.branchPosts[i].id,
                                                textPost: posts.branchPosts[i].textPost,
                                                postTime: posts.branchPosts[i].postTime,
                                                countLike: posts.branchPosts[i].countLike,
                                                LikeArray: posts.branchPosts[i].LikeArray,
                                                senderID: posts.branchPosts[i].senderID,
                                                mainPostId: posts.branchPosts[i].mainPostId,
                                                answerCheck: posts.branchPosts[i].answerCheck,
                                                name: users[j].name,
                                                lastName: users[j].lastName,
                                                avatar: users[j].avatar,
                                                answerPostId: posts.branchPosts[i].answerPostId,
                                                answerUserId: posts.branchPosts[i].answerUserId,
                                                nameAnswer: usersAnswer[g].name,
                                                lastNameAnswer: usersAnswer[g].lastName
                                            }
                                        }
                                    }
                                }
                            }
                        }else{
                            for(let j = 0; j < users.length;j++) {
                                if (posts.branchPosts[i].senderID == users[j]._id) {
                                    newObject =  {
                                        id: posts.branchPosts[i].id,
                                        textPost: posts.branchPosts[i].textPost,
                                        postTime: posts.branchPosts[i].postTime,
                                        countLike: posts.branchPosts[i].countLike,
                                        LikeArray: posts.branchPosts[i].LikeArray,
                                        senderID: posts.branchPosts[i].senderID,
                                        mainPostId: posts.branchPosts[i].mainPostId,
                                        answerCheck: posts.branchPosts[i].answerCheck,
                                        name: users[j].name,
                                        lastName: users[j].lastName,
                                        avatar: users[j].avatar
                                    }
                                }
                            }
                        }
                        sendObject.push(newObject)
                    }

                    res.send(sendObject)
                })
                /*let newObject = {
                    id: posts.branchPosts.id,
                    textPost: posts.branchPosts.textPost,
                    postTime: posts.branchPosts.postTime,
                    countLike: posts.branchPosts.countLike,
                    LikeArray: posts.branchPosts.LikeArray,
                    senderID: posts.branchPosts.senderID,
                    mainPostId: posts.branchPosts.mainPostId,
                    answerCheck: posts.branchPosts.answerCheck,
                    name: users.name,
                    lastName: users.lastName,
                    avatar: users.avatar
                }*/
              /*  let sendObject = []
                for(let i = 0; i < posts.branchPosts.length;i++){
                    let newObject
                    for(let j = 0; j < users.length;j++){
                        if(posts.branchPosts[i].senderID == users[j]._id){
                            newObject =  {
                                id: posts.branchPosts[i].id,
                                textPost: posts.branchPosts[i].textPost,
                                postTime: posts.branchPosts[i].postTime,
                                countLike: posts.branchPosts[i].countLike,
                                LikeArray: posts.branchPosts[i].LikeArray,
                                senderID: posts.branchPosts[i].senderID,
                                mainPostId: posts.branchPosts[i].mainPostId,
                                answerCheck: posts.branchPosts[i].answerCheck,
                                name: users[j].name,
                                lastName: users[j].lastName,
                                avatar: users[j].avatar,
                                answerPostId: posts.branchPosts[i].answerPostId,
                                answerUserId: posts.branchPosts[i].answerUserId
                            }
                        }
                    }
                    sendObject.push(newObject)
                }

*/
              //  res.send(sendObject)
            });


        }else {
            res.send([])
        }
    })
})


app.get('/pressLikePost/:postId/:userId/:hostId', function (req,res) {

    const collection = req.app.locals.collection.collection("post");
    let postIdNumber = Number(req.params.postId)
    collection.find({userID: ObjectId(req.params.hostId)}).toArray(function(err, post) {
        let checkFind = false;
        if(post[0].mainPagePost.length > 0){
            for(let i = 0; i < post[0].mainPagePost.length; i++){
                if(post[0].mainPagePost[i].id == req.params.postId){
                    for(let j = 0; j < post[0].mainPagePost[i].LikeArray.length; j++){
                        if(post[0].mainPagePost[i].LikeArray[j] == req.params.userId){
                            checkFind = true
                        }
                    }
                }
            }
        }

        if(!checkFind){
            collection.updateMany({userID: ObjectId(req.params.hostId)},
                {
                    $push: { "mainPagePost.$[elem].LikeArray" : req.params.userId },
                    $inc: { "mainPagePost.$[elem].countLike" : 1 }
                 },
                { arrayFilters: [ { "elem.id": postIdNumber } ]},
                function  (err, data) {
                    if(err) return console.log(err)
                    if(req.params.userId == req.params.hostId){
                        res.send({check: true})
                    }else {
                        const userCollection = req.app.locals.collection.collection("users");
                        userCollection.findOne({_id: ObjectId(req.params.userId)},function (err, user) {
                            if (err) return console.log(err)

                            let object = {
                                type: "like",
                                name: user.name,
                                lastName:  user.lastName,
                                date: Date.now(),
                                id: req.params.userId,
                            }
                            userCollection.findOneAndUpdate({_id: ObjectId(req.params.hostId)}, {$push: {"notification.arrayNotification":object},$inc: {"notification.countNotification":1}},
                                function (err, user2) {
                                    if (err) return console.log(err)
                                    res.send({check: true})
                                })
                        })
                    }

                    //
                   /* userCollection.findOneAndUpdate({_id: ObjectId(req.params.hostId)}, {$push: {"notification.arrayNotification":obj}},
                        function (err, post) {
                            if (err) return console.log(err)
                        })*/

                })
        }else{
            collection.updateMany({userID: ObjectId(req.params.hostId)},
                {
                    $pull: { "mainPagePost.$[elem].LikeArray" : req.params.userId },
                    $inc: { "mainPagePost.$[elem].countLike" : -1 }
                },
                { arrayFilters: [ { "elem.id": postIdNumber } ]},
                function (err, data) {
                    if(err) return console.log(err)
                    res.send({check: false})
                })
        }
    })

})
app.get('/addOrRemoveFriend/:userID/:hostId', function (req,res) {

    const collection = req.app.locals.collection.collection("users");
    collection.findOne({_id: ObjectId(req.params.userID)}, function (err, user) {
        if(err) return console.log(err)

        let check = false
        for(let i = 0; i < user.friend.length; i++){
            if(user.friend[i] == req.params.hostId) {
                check = true
            }
        }
        if(!check){
            collection.updateMany({_id: ObjectId(req.params.userID)},
                {
                    $push: { "friend" : req.params.hostId },
                },
                function (err, data) {
                    if(err) return console.log(err)
                        const userCollection = req.app.locals.collection.collection("users");
                        userCollection.findOne({_id: ObjectId(req.params.userID)},function (err, user) {
                            if (err) return console.log(err)

                            let object = {
                                type: "addFriend",
                                name: user.name,
                                lastName:  user.lastName,
                                date: Date.now(),
                                id: req.params.userID,
                            }
                            userCollection.findOneAndUpdate({_id: ObjectId(req.params.hostId)}, {$push: {"notification.arrayNotification":object},$inc: {"notification.countNotification":1}},
                                function (err, user2) {
                                    if (err) return console.log(err)
                                    res.send({check: true})
                                })
                        })
                })
        }else{
            collection.updateMany({_id: ObjectId(req.params.userID)},
                {
                    $pull: { "friend" : req.params.hostId },
                },
                function (err, data) {
                    if(err) return console.log(err)
                    res.send({check: false})
                })
        }
    })
})


app.get('/people/:countUser/:pageCount',async function  (req,res) {
    //console.log(req.params)
    const collection = req.app.locals.collection.collection("users");
    let page = Number(req.params.pageCount)
    let user = Number(req.params.countUser)
    const cursor = collection.find().skip(page).limit(user); //правильный вариан ниже
    let arr = []
    await cursor.forEach(element => arr.push(element))
    res.send(arr)
})

app.get('/peopleSearch/:searchString', function  (req,res) {
    //console.log(req.params)
    const collection = req.app.locals.collection.collection("users");
    let name = '',lastName = '',check = true;
    for(let i = 0; i < req.params.searchString.length; i++){
        if(req.params.searchString[i] != ' '){
            if(check){
                name+= req.params.searchString[i]
            }else{
                lastName+= req.params.searchString[i]
            }
        }else{
            check = false
        }
    }
    let stringName = name + " " + lastName

    if(!check){
        /*collection.find(
                {name: {'$regex': name,$options:'i'}}, {lastName: {'$regex': lastName,$options:'i'}}
        ).toArray(function(err, user){
            res.send(user)
        })*/
        collection.find(
            {$or: [{name: {'$regex': name,$options:'i'},lastName: {'$regex': lastName,$options:'i'}},
                    {name: {'$regex': lastName,$options:'i'},lastName: {'$regex': name,$options:'i'}}]}
        ).toArray(function(err, user){
            res.send(user)
        })
    }else{
        collection.find({$or:
                [{name: {'$regex': name,$options:'i'}}, {lastName: {'$regex': name,$options:'i'}}
                    /*{name: {'$regex': lastName,$options:'i'}}, {lastName: {'$regex': name,$options:'i'}}*/]}
        ).toArray(function(err, user){
            res.send(user)
        })
    }

    //res.send({name, lastName})
})


app.post("/upload/:id", upload.single("avatar"), function (req, res, next) {
    let filedata = req.file;

    const collection = req.app.locals.collection.collection("users");
    if(filedata){
        let urlText = ''
        let text = filedata.path
        for(let i = 0;i<text.length;i++){
            if(text[i] != "\\") {
                urlText+= text[i]
            }else{
                urlText+= '/'
            }
        }
        collection.findOneAndUpdate({_id: ObjectId(req.params.id)}, {$set: {avatar: "https://fierce-sierra-39213.herokuapp.com/"+urlText}},
            function (err, url) {
                if(err) return console.log(err)
                let textUrl = url.value.avatar
                let word = '',endPath = "uploads",check = false
                for(let i = 0;i < textUrl.length;i++){
                    if(textUrl[i] != '/'){
                        word+=textUrl[i]
                    }else {
                        if(word=="uploads"){
                            check = true
                        }
                        word = ''
                    }
                    if(check){
                        endPath+=textUrl[i]
                    }
                }

                if(check){
                    fs.unlink((endPath),(err)=> {
                        if (err) console.log(err)
                    })
                }

                res.send("https://fierce-sierra-39213.herokuapp.com/" + urlText)
            })
    }else{
        res.send('/')
    }
});
app.post("/uploadBackground/:id", upload.single("background"), function (req, res, next) {
    let filedata = req.file;

    const collection = req.app.locals.collection.collection("users");
    if(filedata){
        let urlText = ''
        let text = filedata.path
        for(let i = 0;i<text.length;i++){
            if(text[i] != "\\") {
                urlText+= text[i]
            }else{
                urlText+= '/'
            }
        }
        collection.findOneAndUpdate({_id: ObjectId(req.params.id)}, {$set: {"background.url":  "https://fierce-sierra-39213.herokuapp.com/"+urlText}},
            function (err, url) {
                if(err) return console.log(err)

                let textUrl = url.value.background.url
                let word = '',endPath = "uploads",check = false
                for(let i = 0;i < textUrl.length;i++){
                    if(textUrl[i] != '/'){
                        word+=textUrl[i]
                    }else {
                        if(word=="uploads"){
                            check = true
                        }
                        word = ''
                    }
                    if(check){
                        endPath+=textUrl[i]
                    }
                }
                if(check){
                    fs.unlink((endPath),(err)=> {
                        if (err) console.log(err)
                    })
                }


                res.send("https://fierce-sierra-39213.herokuapp.com/" + urlText)
            })
    }else{
        res.send('/')
    }
});
app.get('/changeBackground/:userId/:check', function (req,res) {
    const collection = req.app.locals.collection.collection("users");
    let check = true
    if(req.params.check == "false"){
        check = false
    }

    collection.findOneAndUpdate({_id: ObjectId(req.params.userId)}, {$set: {"background.repeatBackground": check}},
        function (err, check) {
            if(err) return console.log(err)

            res.send(check)
        })

})
app.get('/changeLogin/:userId/:login', function (req,res) {

    const collection = req.app.locals.collection.collection("users");
    collection.findOneAndUpdate({_id: ObjectId(req.params.userId)}, {$set: {login: req.params.login}},
        function (err, check) {
            if(err) return console.log(err)
            res.cookie('login', req.params.login, {secure: true})
            res.send(req.params.login)
        })
})
app.get('/changePassword/:userId/:password', function (req,res) {
    const collection = req.app.locals.collection.collection("users");
    collection.findOneAndUpdate({_id: ObjectId(req.params.userId)}, {$set: {password: req.params.password}},
        function (err, check) {
            if(err) return console.log(err)
            res.cookie('password', req.params.password, {secure: true})
            res.send(req.params.password)
        })
})
app.post('/neuralAnswer', function (req,res) {
    let arrWord = [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]
    let word = req.body.word
    for(let i=0;i < word.length;i++){
        arrWord[i] =  (word[i].charCodeAt(0) - 1070)/ 100
    }
    let data = net.run(arrWord)
    res.send(data[0].toFixed(2))
})

app.post('/clearNotification', function (req,res) {
    const collection = req.app.locals.collection.collection("users");

    collection.findOneAndUpdate({_id: ObjectId(req.body.id)}, {$set: {"notification.arrayNotification": [], "notification.countNotification": 0}},
        function (err, user2) {
            if (err) return console.log(err)
            res.send({check: true})
        })
})

const client = new MongoClient("mongodb+srv://Nekekys:84dizonu@toad.lyb51.mongodb.net/toad?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })

/*client.connect(err => {
    const collection = client.db("sample_airbnb").collection("listingsAndReviews");
    console.log(collection)
    // perform actions on the collection object
    client.close();
});*/




/*app.get('/addNewField', function (req,res) {
    const collection = req.app.locals.collection.collection("users");

    collection.updateMany({},
        {  $set: {notification: {countNotification: 0, arrayNotification: []}} },
        function (err, data) {
            if (err) return console.log(err)
            res.send("gotovo")
        })
})*/


client.connect( function  (err, database) {
    if(err){
        return console.log(err)
    }
   // db = database.db('socialNetwork')
    /*const test1 = db.collection("users")*/
    /*app.locals.collection = db.collection("users")*/
  //  app.locals.collection = db
     //const client = new MongoClient("mongodb+srv://Nekekys:84dizonu@toad.lyb51.mongodb.net/toad?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
    db = client.db('socialNetwork')
    app.locals.collection = db

    app.listen(PORT,function () {
        console.log("start server")
    })
})



