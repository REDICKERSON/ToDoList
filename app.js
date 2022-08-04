//require section

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// --------- MONGOOSE ----------

//mongoose connection info
mongoose.connect("mongodb+srv://REDickerson:Wpsm51613@cluster0.xlpprvk.mongodb.net/todolistDB", {useNewUrlParser: true});

//--------- mongoose Schemas -------

const itemsSchema = {
  name: String
};

const listsSchema = {
  name: String,
  items: [itemsSchema]
}

//--------- mongoose Models ---------

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("list", listsSchema);



//default todolist items
const item1 = new Item({
  name: "Wake up"
});
const item2 = new Item({
  name: "Get dressed"
});
const item3 = new Item({
  name: "Eat breakfast"
});

const defaultItems = [item1, item2, item3];


// ---------- ROUTES ------------

//root route
app.get("/", function(req, res) {

  //populates default list if its empty on start
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Default items successfully added.");
        }
      });
      res.redirect("/");
    }
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  });  

});

//to add items
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){

    item.save();
    res.redirect("/");

  } else {

    List.findOne({name: listName}, function(err, foundList){

      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);

    })
  }
  

});

//to delete items
app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Item successfully deleted.");
        res.redirect("/");
      }    
    });

  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }  

});

//dynamic list get route
app.get("/:customListName", function(req,res){
  
  const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
      if (!err) {
        if (!foundList){
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);

        } else {
          res.render("list", {listTitle: customListName, newListItems: foundList.items });
        }
      }});
  
});

//dynamic list post route
app.post("/:customListName", function(req,res){
  
  const customListName = req.params.customListName;

  const itemName = req.body.newItem;
  const item = new Item({
    name: itemName,
    listName: customListName,
  });

  item.save();

  res.redirect("/lists/"+customListName);
  
});

//about route
app.get("/about", function(req, res){
  res.render("about");
});


//port listener
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
