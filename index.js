const express = require("express");
const fs = require("fs");
const sharp  = require("sharp");
const {Client} = require("pg");
const {exec} =  require('child_process');
const path = require("path");
const formidable = require('formidable');
const crypto = require("crypto")
const session = require("express-session");

app = express();

app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));
//client = new Client({user:})

/*
const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'alinsava',
    database: 'TehniciWeb',
    port: 5432
})*/
const client = new Client({
    host: 'ec2-3-217-113-25.compute-1.amazonaws.com',
    user: 'bnoicdvybxrdnm',
    password: 'ac4a7637b0d59933b050a17b96b5f02d5b95e686e69d6c3a165f831eee510fd8',
    database: 'dc61cc6bni874v',
    port: 5432,
    ssl: {
    	rejectUnauthorized: false
  	}
})

client.connect()

app.set("view engine", "ejs");

app.use("/Resurse", express.static(__dirname + "/Resurse"));

app.use("/*", function(req, res, next){
    client.query("select * from unnest(enum_range(null::tipuri_produse))", function(err, rezCateg){
        res.locals.utilizator = req.session.utilizator;
        if(err)
            RandeazaEroare(res, "Eroare server", 500, "Eroare server", "Eroare server");
        else{
            res.locals.categorii = rezCateg.rows;
        }
        
        next();
    });
})

app.get(["/","/home","/index"], function(req, res){
    console.log(__dirname + "/index.html");
    res.render("Pagini/index", {ip:req.ip, imagini:SelectedImages, imagini_a:UltimeleImagini()});
    //res.sendFile(__dirname + "/index.html");
    
    res.end();

})



app.get("/produse", function(req, res){
    console.log(req.query);
    client.query("select * from unnest(enum_range(null::categ_coperta))", function(err, rezCateg){
        var cond_where=req.query.tip ? ` tip_produs='${req.query.tip}'` : " 1=1";
    
        client.query("select * from books where "+cond_where, function(err, rezQuery){
            //console.log(err);
            //console.log(rezQuery);
            client.query("select MIN(pret) as min, MAX(pret) as max from books", function(err, rezPret){
                console.log("rezultata pret", rezPret.rows[0]);
                res.render("pagini/produse", {produse: rezQuery.rows , optiuni:rezCateg.rows, pretmin:rezPret.rows[0].min, pretmax:rezPret.rows[0].max});
            })
            
        });
    });
});

app.get("/produs/:id", function(req, res){
    //console.log(req.params);
   client.query(`select * from books where id= ${req.params.id}`, function(err, rezQuery){
        console.log(err);
        //console.log(rezQuery);
        res.render("pagini/produs", {prod: rezQuery.rows[0] });
    });
});

app.get("/eroare", function(req, res){
    randeazaEroare(res,1, "Titlu schimbat");

});


app.get("/*.ejs",function(req, res){
    RandeazaEroare(res,403);
    res.end();
})
app.post("/login", function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        var password = crypto.scryptSync(fields.parola, string_cr, 64).toString('hex');;
        var sql = "SELECT * FROM Utilizatori WHERE username = $1 AND parola = $2";
        client.query(sql, [username, password], function(err, result) {
            if (err) {
                console.log(err);
                RandeazaEroare(res,500);
                return;
            }
            if (result.rows.length == 0) {
                RandeazaEroare(res,403);
                return;
            }
            else(result.rows.length == 1)
            {
                req.session.utilizator =
                {
                    nume: result.rows[0].nume,
                    prenume: result.rows[0].prenume,
                    username: result.rows[0].username,
                    email: result.rows[0].email,
                    culoare_chat: result.rows[0].culoare_chat,
                    rol: result.rows[0].rol
                }
                res.redirect("/index");
            }
        });
    });
})
app.get("/logout", function(req, res){
    req.session.destroy();
    res.redirect("/index");
})

string_cr = "abcdefge"; 
app.post("/inreg", function(req, res){
    var username;
    let formular= new formidable.IncomingForm();
	//nr ordine: 4
    formular.parse(req, function(err, campuriText){
        console.log(campuriText);
		eroare ="";
		if(campuriText.username=="" || !campuriText.username.match("^[A-Za-z0-9]+$") || !campuriText.username.match(".{1,10}")){
			eroare+="Username invalid. ";
		}
        if(!campuriText.parola.match("^[A-Za-z0-9]*$") || campuriText.parola==""){
            eroare+="Parola invalida. ";
        }
        if(campuriText.parola != campuriText.rparola){
            eroare+="Parolele nu sunt identice! "
        }
        if(campuriText.nume=="" || !campuriText.nume.match("^[A-Za-z]*$")){
            eroare+="Nume invalid. ";
        }
        if(campuriText.prenume=="" || !campuriText.prenume.match("^[A-Za-z]*$")){
            eroare+="Prenume invalid. ";
        }
        if(campuriText.email==""){
            eroare+="Mail invalid. "
        }
        
        if(eroare)
            res.render("pagini/inregistrare",{err:"Eroare formular. "+eroare, raspuns:""});
        
        if(!eroare){
            queryUtiliz = "SELECT * FROM Utilizatori WHERE username = $1";
            client.query(queryUtiliz, [campuriText.username], function(err, result){
                if(err){
                    console.log(err);
                    RandeazaEroare(res,500);
                    return;
                }
                else if(result.rows.length != 0){
                    eroare += "Username deja folosit.";
                    res.render("pagini/inregistrare",{err:"Eroare formular. "+eroare, raspuns:""});
                    return;
                }
                else{
                    let parolaCriptata= crypto.scryptSync(campuriText.parola, string_cr, 64).toString('hex');
                    let comanda= `insert into utilizatori (username, nume, prenume, parola, email, culoare_chat) values ('${campuriText.username}','${campuriText.nume}', '${campuriText.prenume}', '${parolaCriptata}', '${campuriText.email}', '${campuriText.culoare_chat}')`;
                    //console.log(comanda);
                    client.query(comanda, function(err, rez){
                        if (err){
                            console.log(err);
                            res.render("pagini/inregistrare",{err:"Eroare baza date.", raspuns:"Datele nu au fost introdduse."});
                        }
                        else{
                            res.render("pagini/inregistrare",{err:"", raspuns:"Inregistrat cu succes."});
                            console.log(campuriText.email);
                        }
                    });
                }
                
            });
        }
        
		
    });
});



app.get("*/galerie_animata.css",function(req, res){

    console.log("galerie animata apelata");
    res.setHeader("Content-Type","text/css");

    exec("sass ./resurse/sass/galerie_animata.scss ./temp/galerie_animata.css", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            res.end();
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            res.end();
            return;
        }
        //console.log(`stdout: ${stdout}`);
        res.sendFile(path.join(__dirname,"temp/galerie_animata.css"));
    });

});



app.get("/*", function(req, res){
    res.render("Pagini" + req.url, function(err, rezRender){
        if(err){
            if(err.message.includes("Failed to lookup view")){
                //res.status(404).render("Pagini/404");
                RandeazaEroare(res,404);
            }
            else
            {
                res.render("pagini/eroare_generala");
            }
        }
        else{
            res.send(rezRender);
        }

    });
    

    res.end();
})

function UltimeleImagini(){
    var textFisier=fs.readFileSync("resurse/json/galerie.json")
	var jsi=JSON.parse(textFisier); 

	var caleGalerie=jsi.cale_galerie;
    console.log(caleGalerie);
    let galeria_animata=[]

    for(let i=jsi.imagini.length-1; i>=0 && galeria_animata.length<14; --i)
    {
        var img = path.join(caleGalerie, jsi.imagini[i].fisier);
        galeria_animata.push({image_src:img, titlu:jsi.imagini[i].titlu, descriere:jsi.imagini[i].descriere})
        
    }
    
    return galeria_animata;
}


function creeazaImagini(){
    var buf=fs.readFileSync(__dirname+"/Resurse/Json/galerie.json").toString("utf8");


    obImagini=JSON.parse(buf);//global
    SelectedImages = []


    //console.log(obImagini);
    for (let imag of obImagini.imagini){
        if(SelectedImages.length >= 10)
            break;
        let today = new Date();
        let sfert_ora = Math.floor(today.getMinutes() / 15) + 1;
        //console.log(sfert_ora);
        if(imag.sfert_ora != sfert_ora)
            continue;

        let nume_imag, extensie;
        [nume_imag, extensie ]=imag.fisier.split(".")// "abc.de".split(".") ---> ["abc","de"] imagine.png->imagine.webp
        let dim_mic=150
        
        imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        //console.log(imag.mic);

        imag.mare=`${obImagini.cale_galerie}/${imag.fisier}`;
        if (!fs.existsSync(imag.mic))
            sharp(__dirname+"/"+imag.mare).resize(dim_mic).toFile(__dirname+"/"+imag.mic);


        let dim_mediu=300;
        imag.mediu=`${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png` 
        //console.log(imag.mediu);
        if (!fs.existsSync(imag.mediu))
            sharp(__dirname+"/"+imag.mare).resize(dim_mediu).toFile(__dirname+"/"+imag.mediu);
        SelectedImages.push(imag)

        
    }

}
function creeazaErori(){
    console.log("Dirnameul este: ", __dirname);
    var buf=fs.readFileSync(__dirname+"/Resurse/Json/erori.json").toString("utf8");
    obErori=JSON.parse(buf);//global
    
}

function RandeazaEroare(res, identificator, status,titlu, text, imagine){

    var eroare= obErori.erori.find(function(elem){return elem.identificator == identificator});
    titlu= titlu || (eroare && eroare.titlu) || "Titlu eroare custom";
    text= text || (eroare && eroare.text) || "Titlu eroare custom";
    imagine= imagine || (eroare && (obErori.cale_baza+"/"+eroare.imagine)) || "Titlu eroare custom";
    console.log(imagine);
    if(eroare && eroare.status)
        res.status(eroare.identificator);
    res.render("pagini/eroare_generala",{titlu:titlu, text:text, imagine: imagine});
}



creeazaImagini();
creeazaErori();

//console.log(SelectedImages);
//console.log(obImagini);
console.log("O pornit");

//app.listen(8080)

var s_port=process.env.PORT || 8080;
app.listen(s_port);
