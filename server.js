require("dotenv").config();

const NodeCache = require("node-cache");
const { Client } = require("pg");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const school_cache = new NodeCache({ stdTTL: 60 * 5 });

let client = new Client({
	user: "sbhacksiv",
	password: "1234",
	host: "localhost",
	database: "sbhacksiv_development",
	port: 5432
});

if(process.env.NODE_ENV === "production") {
	client = new Client({
		connectionString: process.env.DB_URL
	});
}

client.connect();

const getCount = () => {
	let school_count_query = 
	`SELECT schools.name, COUNT(*)
	FROM schools
	JOIN applications ON applications.school_id = schools.id
	GROUP BY schools.name
	ORDER BY count DESC;`;

	return new Promise((resolve, reject) => {
		school_cache.get("count", (err, cached_rows) => {
			if(cached_rows) return resolve(cached_rows);

			console.log("querying..");
			client.query(school_count_query, (err, res) => {
				school_cache.set("count", res.rows, (err, success) => {
					resolve(res.rows);
				});
			});
		})
	});
}

app.set("view engine", "ejs");

app.get("/", (req, res) => {
	getCount()
	.then((schools) => {
		res.locals.schools = schools;
		res.render("index");
	});
});

app.listen(port, () => console.log("Server listening in on port", port));