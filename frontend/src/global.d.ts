type GeneralColour = 'yellow' | 'blue' | 'white' | 'orange';

interface TextAndAction {
  text: string;
  action: () => void;
}

// Database Types
interface Member {
  id: string;
  username: string;
  given_name: string;
  surname: string;
  email: string;
  phone: string;
}

// Board Types
type Board = Database['public']['Tables']['board']['Row'];
type Column = Database['public']['Tables']['list']['Row'];
type Card = Database['public']['Tables']['card']['Row'];
// interface Board {
//   id: string;
//   version: number;
//   name: string;
//   description: string;
//   saved_date: string;
//   created_at: string;
//   user_id: string;
//   team_id: string;
// }

interface IColumn {
  id: string;
  board_id: string;
  board_version: number;
  index: number;
  name: string;
  cards: ICard[];
  created_at: string;
}

interface ICard {
  id: string;
  list_id: string | undefined;
  index: number;
  user_creator: string;
  user_assigned: string | undefined;
  title: string;
  description: string;
  deadline: string | undefined;
  created_at: string;
}
