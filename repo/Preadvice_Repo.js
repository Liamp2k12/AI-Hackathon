
CLASS PreadviceRepo() {

    PUBLIC FUNCTION new_preadvice_header(preadvice_id INT, client_id INT, address1 VARCHAR(100), postcode VARCHAR(20), phone_number VARCHAR(15))
        INSERT INTO AXL_WMS_PREADVICE_HEADER_STG(PREADVICE_ID, CLIENT_ID, ADDRESS1, POSTCODE, PHONE_NUMBER)
        VALUES (?, ?, ?, ?, ?, ?);

    PUBLIC FUNCTION new_preadvice_line(preadvice_id INT, client_id INT, sku VARCHAR(50), tag_id VARCHAR(50), address1 VARCHAR(100), postcode VARCHAR(20), phone_number VARCHAR(15))
        INSERT INTO AXL_WMS_PREADVICE_LINE_STG(PREADVICE_ID, CLIENT_ID, SKU, ADDRESS1, POSTCODE, PHONE_NUMBER, TAGID)
        VALUES (?, ?, ?, ?, ?, ?, ?);
};

export new preadviceRepo() as PreadviceRepo();