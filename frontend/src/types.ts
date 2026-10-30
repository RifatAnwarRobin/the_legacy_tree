// Shapes returned by the Django API.

export interface ApiNode {
  id: string;
  data: {
    label: string;
    gender: "M" | "F" | "O" | "U";
    is_living: boolean;
    birth_date: string | null;
    death_date: string | null;
    birth_place: string | null;
  };
}

export interface ApiEdge {
  id: string;
  source: string;
  target: string;
  relation: "parent" | "union";
  kind?: string;
  status?: string;
}

export interface GraphResponse {
  nodes: ApiNode[];
  edges: ApiEdge[];
}

// Data carried by each rendered person node.
export interface PersonNodeData {
  label: string;
  gender: "M" | "F" | "O" | "U";
  isLiving: boolean;
  birthYear: string | null;
  deathYear: string | null;
  birthPlace: string | null;
  delayMs: number;
  [key: string]: unknown;
}

// Full detail from /api/people/{id}/detail_full/ (services.describe()).
interface NamedRef {
  id: string;
  name: string;
}

export interface PersonDetail {
  id: string;
  name: string;
  gender: string;
  birth: { date: string | null; place: string | null };
  parents: NamedRef[];
  children: NamedRef[];
  partners: NamedRef[];
  events: {
    type: string;
    date: string | null;
    place: string | null;
    description: string | null;
  }[];
}
