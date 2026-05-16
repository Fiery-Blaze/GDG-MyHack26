// Constraints
CREATE CONSTRAINT animal_microchip IF NOT EXISTS FOR (a:Animal) REQUIRE a.microchip_id IS UNIQUE;
CREATE CONSTRAINT zoo_id IF NOT EXISTS FOR (z:Zoo) REQUIRE z.id IS UNIQUE;
CREATE CONSTRAINT vet_id IF NOT EXISTS FOR (v:VetClinic) REQUIRE v.id IS UNIQUE;
CREATE CONSTRAINT species_name IF NOT EXISTS FOR (s:Species) REQUIRE s.name IS UNIQUE;

// Seed: Zoos
MERGE (z1:Zoo {id: 'zoo-001'}) SET z1.name = 'Kuala Lumpur Zoo', z1.description = 'Large zoo with diverse wildlife, strong quarantine facilities', z1.cites_ready = true;
MERGE (z2:Zoo {id: 'zoo-002'}) SET z2.name = 'Singapore Zoo', z2.description = 'Excellent genetic diversity programs, high transfer success rate', z2.cites_ready = true;
MERGE (z3:Zoo {id: 'zoo-003'}) SET z3.name = 'Bangkok Safari World', z3.description = 'Specialises in big cats, CITES Appendix I handling experience', z3.cites_ready = true;

// Seed: Species
MERGE (:Species {name: 'Panthera tigris'});
MERGE (:Species {name: 'Ailuropoda melanoleuca'});
MERGE (:Species {name: 'Rhinoceros unicornis'});
MERGE (:Species {name: 'Psittaciformes'});

// Seed: Vet Clinics
MERGE (v1:VetClinic {id: 'vet-001'}) SET v1.name = 'WildCare Veterinary Centre', v1.trust_score = 0.92, v1.availability_days = 2, v1.response_time_avg = 4;
MERGE (v2:VetClinic {id: 'vet-002'}) SET v2.name = 'Asia Wildlife Health', v2.trust_score = 0.85, v2.availability_days = 5, v2.response_time_avg = 8;
MERGE (v3:VetClinic {id: 'vet-003'}) SET v3.name = 'Regional Zoo Vet Services', v3.trust_score = 0.78, v3.availability_days = 3, v3.response_time_avg = 6;

// Vet-Species relationships
MATCH (v:VetClinic {id: 'vet-001'}), (s:Species {name: 'Panthera tigris'}) MERGE (v)-[:TREATS]->(s);
MATCH (v:VetClinic {id: 'vet-001'}), (s:Species {name: 'Rhinoceros unicornis'}) MERGE (v)-[:TREATS]->(s);
MATCH (v:VetClinic {id: 'vet-002'}), (s:Species {name: 'Ailuropoda melanoleuca'}) MERGE (v)-[:TREATS]->(s);
MATCH (v:VetClinic {id: 'vet-002'}), (s:Species {name: 'Panthera tigris'}) MERGE (v)-[:TREATS]->(s);
MATCH (v:VetClinic {id: 'vet-003'}), (s:Species {name: 'Psittaciformes'}) MERGE (v)-[:TREATS]->(s);

// Seed: Animals
MERGE (a1:Animal {microchip_id: 'MC-001'}) SET a1.name = 'Raja', a1.species = 'Panthera tigris', a1.sex = 'male', a1.age = 4, a1.zoo_id = 'zoo-001';
MERGE (a2:Animal {microchip_id: 'MC-002'}) SET a2.name = 'Luna', a2.species = 'Ailuropoda melanoleuca', a2.sex = 'female', a2.age = 6, a2.zoo_id = 'zoo-002';

// Seed: Pet Owner (for lost pet matching)
MERGE (o:PetOwner {name: 'Ahmad Rizal'}) SET o.contact = '+60123456789';
MATCH (o:PetOwner {name: 'Ahmad Rizal'}), (a:Animal {microchip_id: 'MC-001'}) MERGE (o)-[:OWNS]->(a);
