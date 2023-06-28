const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const objectSnakeToCamel = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const districtSnakeToCamel = (newObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const reportSnakeToCamel = (newObject) => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  };
};

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

/*const convertStatesDbObjectToResponseObject = (dbObject) => {
    return{
        stateId : dbObject.state_id,
        stateName : dbObject.state_name,
        population : dbObject.population,
    };
};*/

/*const convertDistrictDbObjectToResponseObject = (dbObject) => {
    return{
        districtId : dbObject.district_id,
        districtName : dbObject.district_name,
        cases : dbObject.cases,
        cured : dbObject.cured,
        active : dbObject.active,
        deaths :dbObject.deaths,
    };
};*/

// API 1
app.get("/states/", async (request, response) => {
  const getAllStates = `
    SELECT 
     * 
    FROM 
     state
    ORDER By state_id;
    `;
  const statesArray = await db.all(getAllStates);
  const statesResult = statesArray.map((eachObject) => {
    return objectSnakeToCamel(eachObject);
  });
  response.send(statesResult);
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
     * 
    FROM 
     state
    WHERE 
     state_id = ${stateId};
    `;
  const state = await db.get(getStateQuery);
  response.send(objectSnakeToCamel(state));
});

//API 3
app.post("/districts/", async (request, response) => {
  const createDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = createDistrict;
  const createDistrictQuery = `
    INSERT INTO 
     district (district_name, state_id, cases, cured, active, deaths)
    VALUES 
     ('${districtName}', ${stateId}, ${cases},${cured}, ${active}, ${deaths});
    `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
     * 
    FROM district 
    WHERE district_id = ${districtId};
    `;
  const district = await db.get(getDistrictQuery);
  const districtResult = districtSnakeToCamel(district);
  response.send(districtResult);
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE 
    FROM 
     district 
    WHERE 
     district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    active,
    cured,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE 
     district
    SET 
     district_name = '${districtName}',
     state_id = ${stateId},
     cases = ${cases},
     cured = ${cured},
     active = ${active},
     deaths = ${deaths}
    Where district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
     SUM(cases) AS cases,
     SUM(cured) AS cured,
     SUM(active) AS active,
     SUM(deaths) as deaths,
    FROM 
     district
    WHERE 
     state_id = ${stateId};
    `;
  const stateStats = await db.get(getStateStatsQuery);
  const resultReport = reportSnakeToCamelCase(stateStats);
  response.send(resultReport);
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetailsQuery = `
    SELECT state_name 
    FROM state JOIN district
      ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};
    `;
  const stateName = await db.get(stateDetailsQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
