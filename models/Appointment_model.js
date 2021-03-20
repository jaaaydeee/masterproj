const { client } = require('../dbConnect');

module.exports.addAppointment = function (apt, cb) {
    const values = ['Available', apt.FacultyID, apt.Location, apt.StartTime, apt.Duration, 'now()'];
    const query = `
        INSERT INTO "Appointment" ("Status", "FacultyID", "Location", "StartTime", "Duration", "Modified") 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *;`;

    client.query(query, values, (err, res) => {
        if (err) {
            cb(null, err);
        } else {
            cb(res, null);
        }
    })
}

module.exports.addAppointments = function (appointment, cb) {
    if (appointment.length == 0) {
        return cb(true, null);
    }

    let AptValues = `VALUES`;
    appointment.forEach(apt => {
        const val = ` ('Available', '${apt.FacultyID}', '${apt.Location}', '${apt.StartTime}', '${apt.Duration}', current_timestamp),`;
        AptValues += val;
    });
    AptValues = AptValues.substring(0, AptValues.length -1);

    const query = `
        INSERT INTO "Appointment" ("Status", "FacultyID", "Location", "StartTime", "Duration", "Modified") 
        ${AptValues} 
        RETURNING *;`;

    client.query(query, (err, res) => {
        if (err) {
            cb(null, err);
        } else {
            cb(res.rows, null);
        }
    });
}

//https://popsql.com/learn-sql/postgresql/how-to-query-date-and-time-in-postgresql
module.exports.getAppointments = function (filter, cb) {
    let extraWhere = ` "StartTime" >= CURRENT_TIMESTAMP AND "Status" <> 'Removed'\n`;

    if ('dateRange' in filter && Array.isArray(filter.dateRange) && filter.dateRange.length == 2) {
        extraWhere += ` AND "StartTime" BETWEEN '${filter.dateRange[0]}' AND '${filter.dateRange[1]}'\n`;
    }

    if ('date' in filter && filter.date) {
        extraWhere += ` AND DATE_PART('day', "StartTime") = DATE_PART('day', ('${filter.date}')::date)\n`;
    }

    if ('facultyID' in filter && filter.facultyID) {
        extraWhere += ` AND "Appointment"."FacultyID" = '${filter.facultyID}'\n`;
    }

    if ('studentID' in filter && filter.studentID) {
        extraWhere += ` AND "Appointment"."StudentID" = '${filter.studentID}'\n`;
    }

    if ('open' in filter && filter.open) {
        extraWhere += ` AND "Appointment"."StudentID" IS NULL AND "Status" != 'Removed'\n`;
    }

    if ('id' in filter && filter.id) {
        extraWhere += ` AND "Appointment"."ID" = '${filter.id}'\n`;
    }

    const extraJoin = ` 
        LEFT JOIN "User" u_0 ON (u_0."StudentID" = "Appointment"."StudentID") \n
        LEFT JOIN "User" u_1 ON (u_1."FacultyID" = "Appointment"."FacultyID") \n
    `;

    const extraSelect = `, 
        u_0."FirstName" as "StudentFirstName", 
        u_0."LastName" as "StudentLastName", 
        u_0."Email" as "StudentEmail", 
        u_1."FirstName" as "FacultyFirstName", 
        u_1."LastName" as "FacultyLastName", 
        u_1."Email" as "FacultyEmail"
    `;

    let query = `
        SELECT "Appointment".* ${extraSelect} FROM "Appointment" ${extraJoin} WHERE TRUE AND ${extraWhere} ORDER BY "StartTime" ASC;
    `;

    client.query(query, (err, res) => {
        if (err) {
            cb(null, err);
        } else {
            cb(res.rows, null);
        }
    });
}

module.exports.setAppointment = function (appointmentID, studentID, cb) {
    //check if appointment exisit first and available
    const q1 = `SELECT * FROM "Appointment" WHERE "ID" = '${appointmentID}'`;
    client.query(q1, (err, res) => {
        if (err) {
            return cb(null, err);
        }

        let apt = typeof res.rows[0] !== "undefined" ? res.rows[0]: false;
        if (apt && !apt.StudentID && apt.Status == 'Available') {
            //update aka schedule apt
            const query = `UPDATE "Appointment"
                SET "StudentID" = '${studentID}',"Status" = 'Scheduled', "Modified" = current_timestamp
                WHERE "ID" = '${appointmentID}'
                RETURNING *;`;
            client.query(query, (err, res) => {
                if (err) {
                    cb(null, err);
                } else {
                    cb(res.rows, null);
                }
            });
        } else {
            cb(null, {error: true, message:"Appointment not available"});
        }
    });
}

module.exports.updateAppointments = function (appointments, action, cb) {
    if (appointments.length == 0) {
        return cb(null, null);
    }

    let ids = "";
    let status = "";
    for (const apt of appointments) {
        ids += `${apt.ID},`;
        status += `'${action}',`;
    }
    ids = ids.substring(0, ids.length - 1);
    status = status.substring(0, status.length - 1);
    const query = `
        UPDATE
            "Appointment" 
        SET
            "Status" = data_table."Status"
        FROM 
            (SELECT UNNEST(ARRAY[${ids}]) as "ID", UNNEST(ARRAY[${status}])::AppointmentStatus as "Status") as data_table
        WHERE
            "Appointment"."ID" =  data_table."ID";
    `;
    client.query(query, (err, res) => {
        if (err) {
            cb(null, err);
        } else {
            cb(res.rows, null);
        }
    });

}

module.exports.cancelAppointment = function (appointmentID, cb) {
    if (appointmentID) {
        const query = `UPDATE "Appointment"
        SET "StudentID" = NULL,"Status" = 'Available', "Modified" = current_timestamp
        WHERE "ID" = '${appointmentID}';`;
        client.query(query, (err, res) => {
            if (err) {
                cb(null, err);
            } else {
                cb(res.rows, null);
            }
        });
    } else {
        cb(null, {error: true, message:"No valid appointmnet provided"});
    }
}

module.exports.removeAppointments = function (appointmentIDs, cb) {
    let q2 = "";
    for (const a of appointmentIDs) {
        q2 += `('${a}', 'Removed', current_timestamp), `;
    }
    if (q2) {
        q2 = q2.substring(0, q2.length - 2);
        const query = `
                UPDATE "Appointment" as apt set
                    "Status" = apt2."Status",
                    "Modified" = apt2."Modified"
                FROM (VALUES
                    ${q2}
                ) as apt2("ID", "Status", "Modified")
                WHERE apt."ID" = apt2."ID";
        `;

        client.query(query, (err, res) => {
            if (err) {
                cb(null, err);
            } else {
                cb(res.rows, null);
            }
        });
    }
}
