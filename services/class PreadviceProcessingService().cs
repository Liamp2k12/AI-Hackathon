class PreadviceProcessingService()

public async function create_preadvice_id(tag_id){
    const preadvice_id = tag_id+'-1-1';
    return preadvice_id;
}

public async function create_preadvice_header(preadvice_id, client_id, address1, postcode, phone_number){
    const preadviceRepo = new PreadviceRepo();
    await preadviceRepo.new_preadvice_header(preadvice_id, client_id, address1, postcode, phone_number);
}