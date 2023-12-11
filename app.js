//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connection to local mongo
// mongodb+srv://braveunknown123:<password>@cluster0.1fphpch.mongodb.net/?retryWrites=true&w=majority
const mongoUrl = process.env.MONGODB_URI;
mongoose.connect(mongoUrl, {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('MongoDB connected successfully');
});


//creating schema
const itemsSchema = {
  name: String
};
//model for that schema
const Item = mongoose.model("Item",itemsSchema);
 
//new items
const item1 = new Item ({
  name: "hello"
});
const item2 = new Item ({
  name: "hello2"
});
const item3 = new Item ({
  name: "hello3"
});

//obejct array
const defaultItems = [item1 , item2 , item3];

//newListPage Schema
const newListPageSchema = {
  title: String,
  items:[itemsSchema]
}

//newListPage model
const NewListPage = mongoose.model("NewListPage", newListPageSchema);
//inseting many
// Inserting many items
// Item.insertMany(defaultItems)
//   .then(() => {
//     console.log("defaultItemsInserted");
//   })
//   .catch((err) => {
//     console.error(err);
//   });




app.get("/", function(req, res) {

  const day = date.getDate();

    //find items
  Item.find({})
  .then(foundItems => {
    if(foundItems.length === 0){
       //inseting many
      // Inserting many items
      Item.insertMany(defaultItems)
      .then(() => {
        console.log("defaultItemsInserted");
      })
      .catch((err) => {
        console.error(err);
      });    
      res.redirect("/");
    }else{
      res.render("list", {listTitle: day, newListItems: foundItems});

    }
  })

  .catch(err => {
    console.error(err);
  });

  
});


app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: item
  });

  const day = date.getDate();


  if(listName === day){
    newItem.save();
    res.redirect("/");
  }else {

    NewListPage.findOne({ title: listName }).exec()
    .then(foundListPage => {
          foundListPage.items.push(newItem);
          foundListPage.save();
          res.redirect("/"+listName);
    })
    .catch(err => {
        console.log(err);
    });
  }

  
  // res.redirect("/")
});



app.post("/delete", function(req,res){
  const rmEle = req.body.checkbox;
  const fromList = req.body.hiddenListName;
  // Perform the deletion logic using the itemId

  const day = date.getDate();
  if(fromList === day){
    Item.findByIdAndDelete(rmEle)
      .then(() => {
        console.log("Item deleted successfully");
        res.redirect("/");
      })
      .catch(err => {
        console.error(err);
      });
  }else{
  NewListPage.findOneAndUpdate({title: fromList}, {$pull: {items:{_id:rmEle}}})
    .exec()
    .then(
      res.redirect("/" + fromList)
    )
    .catch(err => {
      console.error(err);
    });
  }
});


// app.get("/:customListName", function(req,res){
//   const custTitle = req.params.customListName;
//   //found list is the whole object whouse title field matches the custom title.
//  NewListPage.findOne({title:custTitle}, function(err, foundList){
//   if(err){
//     console.log(err);
//   }else{
//     if(foundList){
//       //display the list
//       res.render("list", {listTitle: foundList.title, newListItems: foundList.items});
//     }
//     else{
//       //create and display the list
//       const listPage = new NewListPage({
//         title: custTitle,
//         items: defaultItems
//       })
//       listPage.save()
//       res.redirect("/"+custTitle);
//     }

//   }
//  })
  


// })

app.get("/:customListName", function(req, res) {
  const custTitle = _.capitalize(req.params.customListName);

  // Use findOne and chain the exec method to execute the query
  NewListPage.findOne({ title: custTitle }).exec()
    .then(foundList => {
      if (foundList) {
        // display the list
        res.render("list", { listTitle: foundList.title, newListItems: foundList.items });
      } else {
        // create and display the list
        const listPage = new NewListPage({
          title: custTitle,
          items: defaultItems
        });
        listPage.save();
        res.redirect("/" + custTitle);
      }
    })
    .catch(err => {
      console.error(err);
    });
});
 

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
