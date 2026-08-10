var express = require("express");
var app=express();
app.listen(2002,function(){
    console.log("Server Started at localhost:2002!!");
})

require('dotenv').config();

app.use(express.static("public"));
app.use(express.urlencoded(true));
var mysql=require("mysql2");

var fileuploader=require("express-fileupload");
app.use(fileuploader());
var cloudinary=require("cloudinary").v2;

const { GoogleGenerativeAI } = require("@google/generative-ai");

cloudinary.config({ 
        cloud_name:process.env.CLOUD_NAME,
        api_key:process.env.CLOUD_API_KEY,
        api_secret:process.env.CLOUD_API_SECRET
        });

let url=process.env.AIVEN_URL;
        let mysqlCon=mysql.createConnection({uri:url,dateStrings:true});
        mysqlCon.connect(function(err){
                if(err==null)
                      console.log("SQL Connected Successssfullllyyyyy") ;
                else
                        console.log(err.message);
        })

//------------For Uploads on render-------
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
//---------------------------------------------------------

//------------- Signup Page (Button) ---------------------//
app.post("/signup-process", function(req,resp)
{
    let emailid=req.body.txtEmail;
    let pwd=req.body.txtPwd;
    let utype=req.body.utype;

    mysqlCon.query("insert into userspro values(?,?,?,current_date(),1)",[emailid,pwd,utype],function(err) {
        if(err==null)
              resp.send("Signup Sucessfull")  ;
        else
                resp.send(err.message);
    })
})

//------------- Login Page (Button) ---------------------//
app.get("/btnLogin",function(req,resp)
{
    let emailid=req.query.emailid;
    let pwd=req.query.pwd;

    //------------------------ Admin Login ----------------------
    if(emailid==process.env.ADMIN_ID && pwd==process.env.ADMIN_PASS)
    {
        resp.send("admin");
        return;
    } 

    //------------------------ User Login --------------------------
    mysqlCon.query("select * from userspro where emailid=? AND pwd=?",
    [emailid, pwd],
    function(err,resultJSONAry) 
    {
        if(err)
            {
                resp.send(err.message);
                return;
            }

        if(resultJSONAry.length==0)
            {
                resp.send("Invalid UserId/Password");
                return;
            }

        if(resultJSONAry[0].active!=1)
            {
                resp.send("ID Blocked..");
                return;
            }
            
        // Donor/Needy/Ngo
        resp.send(resultJSONAry[0].utype);
    })
})

//------------- Donor Profile (Submit) ---------------------//
app.post("/donor-process",async function(req,resp)
{
    // Aadhaar Card Upload
let aCardUrl = "nopic.jpg";

if (req.files && req.files.aPic) {

    let fileName = req.files.aPic.name;
    let fullPath = __dirname + "/uploads/" + fileName;

    await req.files.aPic.mv(fullPath);

    await cloudinary.uploader.upload(fullPath).then(function(result) {
        aCardUrl = result.url;
    });
}


// Profile Pic Upload
let picUrl = "nopic.jpg";

if (req.files && req.files.pPic) {

    let fileName = req.files.pPic.name;
    let fullPath = __dirname + "/uploads/" + fileName;

    await req.files.pPic.mv(fullPath);

    await cloudinary.uploader.upload(fullPath).then(function(result) 
    {
        picUrl = result.url;
    });
}

    let acardpath = aCardUrl;
    let picpath = picUrl;

    let emailid=req.body.txtDEmail;
    let name=req.body.dName;
    let mobile=req.body.dMob;
    let address=req.body.dAdd;
    let city=req.body.dCity;
    

    mysqlCon.query("insert into dprofiles values(?,?,?,?,?,?,?)",[emailid,name,mobile,address,city,acardpath,picpath],function(err) {
        if(err==null)
              resp.send("Your Profile Record Saved Successfully!!!!")  ;
        else
                resp.send(err.message);
    })
    
})

//------------- Donor Profile (Update) ---------------------//
app.post("/donor-profile-update", async function(req, resp)
{
    // Old URLs
    let acardpath = req.body.hdnA;
    let picpath = req.body.hdnP;

    // Upload Aadhaar Card
    //if(req.files != null && req.files.pPic)
    if(req.files != null)
    {
        let fileName = req.files.aPic.name;
        let fullPath = __dirname + "/uploads/" + fileName;

        await req.files.aPic.mv(fullPath);

        let result = await cloudinary.uploader.upload(fullPath);
        acardpath = result.url;
    }

    // Upload Profile Pic
    //if(req.files != null && req.files.pPic)
    if(req.files != null)
    {
        let fileName = req.files.pPic.name;
        let fullPath = __dirname + "/uploads/" + fileName;

        await req.files.pPic.mv(fullPath);

        let result = await cloudinary.uploader.upload(fullPath);
        picpath = result.url;
    }

    // Form Data
    let emailid = req.body.txtDEmail;
    let name = req.body.dName;
    let mobile = req.body.dMob;
    let address = req.body.dAdd;
    let city = req.body.dCity;

    // Update Query
    mysqlCon.query(
        "update dprofiles set name=?, mobile=?, address=?, city=?, acardpath=?, picpath=? where emailid=?",
        [name, mobile, address, city, acardpath, picpath, emailid],
        function(err)
        {
            if(err == null)
                resp.send("Record Updated Successfully");
            else
                resp.send(err.message);
        }
    );
});

//------------- Donor Profile (Fetch) ----------------------//
app.get("/donor-profile-fetch", function (req, resp) {

    let emailid = req.query.emailidKuch;

    mysqlCon.query(
        "select * from dprofiles where emailid=?",
        [emailid],
        function (err, resultJSONAry) {

            if (err == null)
                resp.send(resultJSONAry);
            else
                resp.send(err.message);

        });
});


//------------- Donor [Avail-Med (Submit)] --------------------------//
app.post("/avail-process",async function(req,resp)
{
    // Aadhaar Card Upload
    let mPicUrl = "nopic.jpg";
    if (req.files && req.files.mPic) 
    {
        let fileName = req.files.mPic.name;
        let fullPath = __dirname + "/uploads/" + fileName;

        await req.files.mPic.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function(result) 
        {
            mPicUrl = result.url;
        });
    }

    let mpicurl = mPicUrl;
    
    let emailid = req.body.txtDEmail;
    let medname = req.body.mName;
    let expdate = req.body.txtExp;
    let company = req.body.txtComp;
    let packing = req.body.txtPack;
    let qty = req.body.txtQty;
    let info = req.body.txtOther;

    mysqlCon.query("insert into medicines values(?,?,?,?,?,?,?,?,?)",[null,emailid,medname,expdate,company,packing,qty,info,mpicurl],function(err) {
        if(err==null)
              resp.send("Your Medicine Record Saved Successfully!!!!")  ;
        else
                resp.send(err.message);
    })
});

//-------------Donor [Avail Equipment (Submit)] ---------------------//
app.post("/Avail-Equipment",async function(req,resp)
{
    // Pic1 Upload
let pic1Url = "nopic.jpg";

if (req.files && req.files.ePic) {

    let fileName = req.files.ePic.name;
    let fullPath = __dirname + "/uploads/" + fileName;

    await req.files.ePic.mv(fullPath);

    await cloudinary.uploader.upload(fullPath).then(function(result) {
        pic1Url = result.url;
    });
}


// Pic 2 Upload
let pic2Url = "nopic.jpg";

if (req.files && req.files.e2Pic) {

    let fileName = req.files.e2Pic.name;
    let fullPath = __dirname + "/uploads/" + fileName;

    await req.files.e2Pic.mv(fullPath);

    await cloudinary.uploader.upload(fullPath).then(function(result) 
    {
        pic2Url = result.url;
    });
}

    let pic1url = pic2Url;
    let pic2url = pic2Url;

    let emailid=req.body.txtDEmail;
    let equipment=req.body.eName;
    let conditionn=req.body.eCon;
    let typee=req.body.eType;
    let amount=req.body.eAmount;
    let info=req.body.eInfo;
    

    mysqlCon.query("insert into equipments values(?,?,?,?,?,?,?,?,?)",[null,emailid,equipment,conditionn,typee,amount,pic1url,pic2url,info],function(err) {
        if(err==null)
              resp.send("Your Equipment Record Saved Successfully!!!!")  ;
        else
                resp.send(err.message);
    })
})

    //--------------------- Angular [Fetch-all-users] 'admin_users_Dash' ---------------------------------//
    app.get("/fetch-all-users", function(req, resp)
{
    mysqlCon.query("select*from userspro", function(err, resultJSONAry)
    {
        if(err==null)
            resp.send(resultJSONAry);
        else
            resp.send(err.message);
    });
});

//-------------------------- [Fetch ALL Users] block -------------------------
app.get("/block-user",function(req,resp)
{
    let email=req.query.emailidKuch;

    mysqlCon.query("update userspro set active=0 where emailid=?",[email],function(err,result)
    {
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("User Blocked Successfully");
            else
                resp.send("Invalid Email");
        }
        else
            resp.send(err.message);
    });
});

//------------------------- [fetch all users] resume --------------------
app.get("/resume-user",function(req,resp)
{
    let email=req.query.emailidKuch;

    mysqlCon.query("update userspro set active=1 where emailid=?",[email],function(err,result)
    {
        if(err==null)
        {
            if(result.affectedRows==1)
                resp.send("User Activated Successfully");
            else
                resp.send("Invalid Email");
        }
        else
            resp.send(err.message);
    });
});
//------------------------------- [admin-user-dash] DELETE ---------------------------//
app.get("/delete-user",function(req,resp){

    let email=req.query.emailidKuch;

    //Delete from child tables first
    mysqlCon.query("DELETE FROM medicines WHERE emailid=?", [email]);
    mysqlCon.query("DELETE FROM equipments WHERE emailid=?", [email]);
    mysqlCon.query("DELETE FROM dprofiles WHERE emailid=?", [email]);
    mysqlCon.query("DELETE FROM needys WHERE emailid=?", [email]);
    mysqlCon.query("DELETE FROM ngos WHERE emailid=?", [email]);

    mysqlCon.query(
        "delete from userspro where emailid=?",
        [email],
        function(err,result)
        {
            if(err)
            {
                resp.send(err.message);
                return;
            }
            if(result.affectedRows==1)
                resp.send("User and all associated records are deleted successfully.")
            else
                resp.send("Invalid Email");
            //if(err==null)
            //{
                //if(result.affectedRows==1)
                  //  resp.send("User Deleted Successfully");
                //else
                //    resp.send("Invalid Email");
            //}
            //else
              //  resp.send(err.message);
        });

});

//------------------------------- Angular [Fetch - ALL - DONORS] ----------------------//
app.get("/fetch-all-donors", function(req, resp)
{
    mysqlCon.query("select * from dprofiles", function(err, resultJSONAry)
    {
        if(err==null)
            resp.send(resultJSONAry);
        else
            resp.send(err.message);
    });
});

//--------------------------------- Donor's Dashboard ------------------------------------//
//----------Fetch Medicine [med manager]-------------
app.get("/fetch-medicine", function(req,res){
    var email=req.query.emailid;
    mysqlCon.query("select*from medicines where emailid=?",[email],
        function(err,result){
            res.send(result)
        });
})

//-----------Delete [fetch-medicine] [med manager] ------------------
app.get("/delete-medicine", function(req,res){
    var rid=req.query.rid;
    mysqlCon.query("delete from medicines where rid=?", [rid],
        function(err){
            res.send("Deleted");
        });
})

//------------Fetch Equipments [equip manager] ----------------------------------------------
app.get("/fetch-equipment", function(req,res){
    var email=req.query.emailid;
    mysqlCon.query("select*from equipments where emailid=?", [email],
        function(err,result){
            res.send(result)
        });
})

//------------Delete [fetch-equipment] [equip-manager] ---------------------------------------
app.get("/delete-equipment", function(req,res){
    var rid=req.query.rid;
    mysqlCon.query("delete from equipments where rid=?", [rid],
        function(err){
            res.send("Deleted");
        });
})

// ------------ Update Password [settings] ---------------------------------------------------
app.get("/update-password", function(req,res){

    //console.log(req.query);

    var email=req.query.emailid;
    var oldpwd= req.query.oldpwd;
    var newpwd=req.query.newpwd;

    //console.log("Email:", email);
    //console.log("Old:", oldpwd);
    //console.log("New:", newpwd);

    mysqlCon.query("Update userspro set pwd=? where emailid=? and pwd=?", [newpwd,email,oldpwd],
        function(err,result){
            if(err){
                res.send(err);
                return;
            }

            if(result.affectedRows==1)
                res.send("Password updated Successfully");
            else
                res.send("Existing password is Incorrect");
        });
});

//-------------- admin-needy-dashboard---------------------
app.get("/fetch-all-needy",function(req,res){

    mysqlCon.query("select * from needys",
        function(err,result){
            if(err)
                res.send(err);
            else
                res.send(result);
        });
});

//------------------------- [Needy Profile] ----------------------------------------//
app.post("/needy-process", async function(req,res){

    try{

        //------------ Basic Details -----------------

        let email = req.body.txtNEmail;
        let mobile = req.body.nMob;

        //------------ Front Aadhaar -----------------

        let frontUrl = req.body.hdnAF;

        if(req.files && req.files.aFPic)
        {
            let fileName = req.files.aFPic.name;

            let fullPath = __dirname + "/uploads/" + fileName;

            await req.files.aFPic.mv(fullPath);

            let result = await cloudinary.uploader.upload(fullPath);

            frontUrl = result.secure_url;
        }

        //------------ Rear Aadhaar -----------------

        let rearUrl = req.body.hdnAR;

        if(req.files && req.files.aRPic)
        {
            let fileName = req.files.aRPic.name;

            let fullPath = __dirname + "/uploads/" + fileName;

            await req.files.aRPic.mv(fullPath);

            let result = await cloudinary.uploader.upload(fullPath);

            rearUrl = result.secure_url;
        }

        //------------ Gemini AI -----------------

        //let jsonData = await YatikshaGoyalTool(frontUrl, rearUrl);
        let jsonData;

        try
        {
            jsonData = await YatikshaGoyalTool(frontUrl, rearUrl);
        }
        catch(err)
        {
            if(err.message=="AI_BUSY")
            {
                res.status(503).send("⚠️ AI service is currently busy. Please try again after 2-3 minutes.");
                return;
            }
            throw err;
        }
        

        let name = jsonData.name;
        let acardno = jsonData.adhaar_number;
        let address = jsonData.address;
        let gender = jsonData.gender;
        let dob = jsonData.dob;

        //------------ Save in MySQL -----------------

        mysqlCon.query(

            "insert into needys(emailid,mobile,fronturl,rearurl,name,acardno,address,gender,dob) values(?,?,?,?,?,?,?,?,?)",

            [
                email,
                mobile,
                frontUrl,
                rearUrl,
                name,
                acardno,
                address,
                gender,
                dob
            ],

            function(err){

                if(err)
                {
                    res.send(err);
                    return;
                }

                res.send("Record Saved Successfully");

            }

        );

    }
    catch(err)
    {
        console.log(err);
        //res.send(err.message);
        res.status(500).send("Something went wrong. Please try again.");
    }

});

//---------------- Gen AI [needy's profile] [AI Function] -----------------------

const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API_KEY);
const model = genAI.getGenerativeModel({model:"gemini-3.5-flash"}); //else = model:"gemini-3.5-flash"

async function YatikshaGoyalTool(frontUrl, rearUrl)
{
    try
    {
        const myprompt = "You are given FRONT and REAR images of the same Aadhaar Card. Extract: name,adhaar_number,gender,dob,address and Return ONLY JSON. like = name:'',adhaar_number:'',gender:'',dob:'',address:'';"

        //---------- FRONT IMAGE ----------
        const frontResp = await fetch(frontUrl)
        .then((response)=>response.arrayBuffer());

        //---------- REAR IMAGE ----------
        const rearResp = await fetch(rearUrl)
        .then((response)=>response.arrayBuffer());


        const result = await model.generateContent([
            {
                inlineData:
                {
                    data: Buffer.from(frontResp).toString("base64"),
                    mimeType:"image/jpeg"
                }
            },

            {
                inlineData:
                {
                    data: Buffer.from(rearResp).toString("base64"),
                    mimeType:"image/jpeg"
                }
            },
            myprompt,
        ]);
        //console.log(result.response.text())

        const cleaned= result.response.text()
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim();

        return JSON.parse(cleaned);
    }
    catch(err)
    {
        console.log("Gemini Error:", err);
        throw new Error("AI_BUSY")
    }
}

//-------------------Upload Gen-ai route -----------------------
app.post("/ai-read-pic", async function(req,res){

    if(req.files==null)
    {
        res.send("No File");
        return;
    }

    //---------------- Front Upload ----------------

    let frontName=req.files.aFPic.name;

    //let frontPath=__dirname+"/uploads/"+frontName;
    let frontPath = path.join(uploadDir, frontName);

    await req.files.aFPic.mv(frontPath);

    let frontResult=await cloudinary.uploader.upload(frontPath);

    let frontUrl=frontResult.secure_url;


    //---------------- Rear Upload ----------------

    let rearName=req.files.aRPic.name;

    //let rearPath=__dirname+"/uploads/"+rearName;
    let rearPath = path.join(uploadDir, rearName);

    await req.files.aRPic.mv(rearPath);

    let rearResult=await cloudinary.uploader.upload(rearPath);

    let rearUrl=rearResult.secure_url;


    //---------------- Gemini ----------------

    let jsonData=await YatikshaGoyalTool(frontUrl,rearUrl);

    res.send(jsonData);

});

//------------------------------- Needy Dash [Med-Finder] ---------------------------------
    
    //----------------------Fetch Cities-------------------------
app.get("/fetch-cities",function(req,res){

    mysqlCon.query(
        "select distinct city from dprofiles",
        function(err,result){

            if(err)
            {
                console.log(err);
                res.send(err);
                return;
            }

            res.send(result);

        });

});

    //----------------------Fetch Medicines-------------------------
app.get("/fetch-medicines",function(req,res){

    mysqlCon.query(

        "select distinct medname from medicines inner join dprofiles on medicines.emailid=dprofiles.emailid",

        function(err,result){

            if(err)
            {
                console.log(err);
                res.send(err);
                return;
            }

            res.send(result);

        });

});

    //----------------------Find Medicines-------------------------
app.get("/find-medicine", function(req,res){

    let city = (req.query.city || "").trim();
    let medicine = (req.query.medicine || "").trim();

    let sql = `SELECT dprofiles.name, dprofiles.emailid, dprofiles.mobile, dprofiles.city, medicines.medname, medicines.mpicurl, medicines.expdate, medicines.packing, medicines.qty FROM dprofiles INNER JOIN medicines ON dprofiles.emailid = medicines.emailid`;

let values = [];

    if(city !== "" && medicine !== "")
    {
        sql += " WHERE dprofiles.city=? AND medicines.medname=?";
        values.push(city, medicine);
    }
    else if(city !== "")
    {
        sql += " WHERE dprofiles.city=?";
        values.push(city);
    }
    else if(medicine !== "")
    {
        sql += " WHERE medicines.medname=?";
        values.push(medicine);
    }

    console.log(values);


    mysqlCon.query(sql, values, function(err,result){

        if(err)
        {
            res.send(err);
            return;
        }

        res.send(result);

    });

});

//------------------------------- Needy Dash [Equipment-Finder] ---------------------------------
    
    //----------------------Fetch Cities-------------------------
app.get("/fetch-cities",function(req,res){

    mysqlCon.query(
        "select distinct city from dprofiles",
        function(err,result){

            if(err)
            {
                console.log(err);
                res.send(err);
                return;
            }

            res.send(result);

        });

});

    //----------------------Fetch Equipments-------------------------
app.get("/fetch-equipments",function(req,res){

    mysqlCon.query(

        `select distinct equipment from equipments inner join dprofiles on equipments.emailid=dprofiles.emailid`,

        function(err,result){

            if(err)
            {
                console.log(err);
                res.send(err);
                return;
            }

            res.send(result);

        });

});

    //----------------------Find Equipment-------------------------
app.get("/find-equipment", function(req,res){

    let city = (req.query.city || "").trim();
    let equipment = (req.query.equipment || "").trim();

    let sql = 
        `SELECT dprofiles.name,dprofiles.emailid,dprofiles.mobile,dprofiles.city, equipments.equipment,equipments.conditionn,equipments.typee,equipments.amount,equipments.pic1url,equipments.pic2url,equipments.info FROM dprofiles INNER JOIN equipments ON dprofiles.emailid = equipments.emailid`;

let values = [];

    if(city !== "" && equipment !== "")
    {
        sql += " WHERE dprofiles.city=? AND equipments.equipment=?";
        values.push(city, equipment);
    }
    else if(city !== "")
    {
        sql += " WHERE dprofiles.city=?";
        values.push(city);
    }
    else if(equipment !== "")
    {
        sql += " WHERE equipments.equipment=?";
        values.push(equipment);
    }


    mysqlCon.query(sql, values, function(err,result){

        if(err)
        {
            res.send(err);
            return;
        }

        res.send(result);

    });

});

//-------------------------------- NGO Dash [profile - Registration] --------------------------------

app.post("/ngo-process", async function(req,res){

    let picUrl="";

    // Upload Image
    if(req.files!=null && req.files.pic)
    {
        let fileName=req.files.pic.name;
        let fullPath=__dirname+"/uploads/"+fileName;

        await req.files.pic.mv(fullPath);

        await cloudinary.uploader.upload(fullPath)
        .then(function(result){

            picUrl=result.url;

        });
    }

    let emailid=req.body.emailid;
    let ngo=req.body.ngo;
    let regoffice=req.body.regoffice;
    let city=req.body.city;
    let website=req.body.website;
    let contactno=req.body.contactno;
    let since=req.body.since;
    let chairperson=req.body.chairperson;
    let ngoworks=req.body.ngoworks;
    let regnumber=req.body.regnumber;

    mysqlCon.query(

        "insert into ngos(emailid,ngo,regoffice,city,website,contactno,since,chairperson,ngoworks,regnumber,picurl) values(?,?,?,?,?,?,?,?,?,?,?)",

        [
            emailid,
            ngo,
            regoffice,
            city,
            website,
            contactno,
            since,
            chairperson,
            ngoworks,
            regnumber,
            picUrl
        ],

        function(err){

            if(err)
            {
                res.send(err);
                return;
            }

            res.send("NGO Registered Successfully");

        });

});

//------------------ Ngo Dash [Fetch] -----------------------------------------

app.get("/ngo-fetch",function(req,res){

    let email=req.query.emailid;

    mysqlCon.query(

        "select * from ngos where emailid=?",

        [email],

        function(err,result){

            if(err)
            {
                res.send(err);
                return;
            }

            res.send(result);

        });

});

//-------------------------------- NGO Update --------------------------------

app.post("/ngo-update",async function(req,res){

    let picUrl=req.body.hdnPic;

    if(req.files!=null && req.files.pic && req.files.pic.name!="")
    {
        let fileName=req.files.pic.name;

        let fullPath=__dirname+"/uploads/"+fileName;

        await req.files.pic.mv(fullPath);

        let result=await cloudinary.uploader.upload(fullPath);

        picUrl=result.url;
    }

    mysqlCon.query(

        "update ngos set ngo=?,regoffice=?,city=?,website=?,contactno=?,since=?,chairperson=?,ngoworks=?,regnumber=?,picurl=? where emailid=?",

        [

            req.body.ngo,
            req.body.regoffice,
            req.body.city,
            req.body.website,
            req.body.contactno,
            req.body.since,
            req.body.chairperson,
            req.body.ngoworks,
            req.body.regnumber,
            picUrl,
            req.body.emailid

        ],

        function(err,result){

            if(err)
            {
                res.send(err);
                return;
            }

            if(result.affectedRows==0)
                res.send("Invalid Email Id");

            else
                res.send("Record Updated Successfully");

        });

});

//--------------- Needy Dashboard [Ngo-Finder] -------------------------------------

//------------ Fetch NGO Cities -----------------
app.get("/fetch-ngo-cities",function(req,res){

    mysqlCon.query(
        "select distinct city from ngos",
        function(err,result){

            if(err)
            {
                res.send(err);
                return;
            }

            res.send(result);

        });

});

//------------ Find NGOs -----------------
app.get("/find-ngos",function(req,res){

    let city=(req.query.city || "").trim();

    let sql="select * from ngos";
    let values=[];

    if(city!="")
    {
        sql+=" where city=?";
        values.push(city);
    }

    mysqlCon.query(sql,values,function(err,result){

        if(err)
        {
            res.send(err);
            return;
        }

        res.send(result);

    });

});

//------------------------------------------------------------------------------------------------------

//-------------------------------- Admin [NGO Dashboard] ----------------------------

app.get("/fetch-all-ngos",function(req,res){

    mysqlCon.query(
        "select * from ngos",
        function(err,result){

            if(err)
            {
                res.send(err);
                return;
            }

            res.send(result);

        });
});

//--------------------------------------------------------------------------------------