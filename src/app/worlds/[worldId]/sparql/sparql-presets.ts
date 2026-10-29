/** SPARQL JSON results, a mutation acknowledgement, or an API error. */
export type SparqlResponse = {
  boolean?: boolean;
  message?: string;
  ok?: boolean;
  success?: boolean;
  status?: string;
  head?: { vars?: string[] };
  results?: {
    bindings?: Array<Record<string, { value: unknown; type: string }>>;
  };
  error?: { message?: string; code?: string };
};

export const PRESET_QUERIES = [
  {
    name: "Insert sample triples",
    query: `PREFIX ex: <http://example.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA {
  ex:Agent1 rdf:type ex:Agent ;
            ex:status "Active" ;
            ex:name "Wazoo Bot" .
}`,
  },
  {
    name: "Select all triples",
    query: `SELECT ?s ?p ?o WHERE {
  ?s ?p ?o .
} LIMIT 100`,
  },
  {
    name: "Find type definitions",
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?subject ?type WHERE {
  ?subject rdf:type ?type .
} LIMIT 50`,
  },
  {
    name: "Ask check status",
    query: `PREFIX ex: <http://example.org/>

ASK WHERE {
  ?agent ex:status "Active" .
}`,
  },
  {
    name: "Delete sample triples",
    query: `PREFIX ex: <http://example.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

DELETE DATA {
  ex:Agent1 rdf:type ex:Agent ;
            ex:status "Active" ;
            ex:name "Wazoo Bot" .
}`,
  },
];
