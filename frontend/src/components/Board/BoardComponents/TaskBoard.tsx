import { useEffect, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { TaskColumn } from './TaskColumn';
import { useClient } from '@/contexts/AppContext';
import EditCardModal from './EditCardModal';
import dayjs from 'dayjs';
import { useUser } from '@/hooks';
import { uuidv4 } from '@/utils/common-utils';
import { Board } from 'schema-v2';

interface IBoardProp {
  board: Board;
  refreshCards: boolean;
  setRefreshCards: React.Dispatch<React.SetStateAction<boolean>>;
  setBoardData: (val: BoardData | null) => void;
}

export function TaskBoard({
  board,
  setBoardData,
  refreshCards,
  setRefreshCards,
}: IBoardProp) {
  // Get Columns/Cards from Supabase
  const supabase = useClient();
  const [columns, setColumns] = useState<Column[] | undefined | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const user = useUser();

  // Get Columns
  useEffect(() => {
    async function getColumns() {
      const { data } = await supabase
        .from('list')
        .select()
        .match({ board_id: board?.id, board_version: board?.version })
        .order('index', { ascending: true });
      setColumns(data);
    }
    getColumns();
  }, [board, supabase]);

  // Get Cards of each Column
  useEffect(() => {
    async function getCards(cols: Column[]) {
      const { data } = await supabase
        .from('card')
        .select()
        .in(
          'list_id',
          cols.map((col: Column) => col.id),
        )
        .order('index', { ascending: true });

      return data;
    }

    function getColumnCards() {
      if (!columns) {
        return;
      }
      getCards(columns).then((res) => {
        const card_list: Card[] | null = res;
        if (card_list && (card_list.length >= cards.length || refreshCards)) {
          setCards(card_list);
          setRefreshCards(false);
        }
      });
    }

    getColumnCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, supabase]);

  // Edit Card Modal
  const [currentEditCard, setCurrentEditCard] = useState<Card | null>();
  const [editModalVisibility, setEditModalVisibility] = useState(false);

  const onDeleteCardClick = (card: Card) => {
    setCards((old_cards) => {
      const index = old_cards.findIndex((c) => {
        return c.id == card.id;
      });
      if (index >= 0) {
        old_cards = old_cards.splice(index, 1);
      }
      return [...old_cards];
    });
  };

  const onSaveCardClick = (newCard: Card) => {
    if (!newCard) {
      return;
    }
    setCards((old_cards) => {
      return old_cards.map((old_card) =>
        old_card.id === newCard.id ? { ...newCard } : { ...old_card },
      );
    });
  };

  const onAddColumn = () => {
    setColumns((old_columns) => {
      let index = 0;
      if (!old_columns) {
        return old_columns;
      }
      if (old_columns?.length > 0) {
        index =
          old_columns?.reduce((prev, curr) => {
            return prev?.index > curr?.index ? prev : curr;
          })?.index + 1;
      }
      return [
        ...old_columns,
        {
          id: uuidv4(),
          board_id: board?.id,
          board_version: board?.version,
          created_at: new Date().toISOString(),
          index: index,
          name: 'New Column',
          user_id: user?.id,
        },
      ];
    });
  };

  const onEditColumn = (newName: string, col: Column) => {
    setColumns((old_columns) => {
      const index = old_columns?.indexOf(col);
      if (index == undefined || !old_columns) {
        return old_columns;
      }
      old_columns[index].name = newName;
      return [...old_columns];
    });
  };

  const onDeleteColumn = (col: Column) => {
    setColumns((old_columns) => {
      return old_columns?.filter((c) => c.id != col.id);
    });
    setCards((old_cards) => {
      return old_cards?.filter((c) => c.id != col.id);
    });
  };
  const toggleEditModalVisibility = () => {
    if (editModalVisibility) {
      setCurrentEditCard(null);
    }
    setEditModalVisibility(!editModalVisibility.valueOf());
  };

  const [columnElements, setColumnElements] = useState<JSX.Element[]>();
  useEffect(() => {
    const onAddCardClick = (col: Column) => {
      const column_cards = cards?.filter((card) => card.list_id == col.id);
      let index = 0;
      if (column_cards.length > 0) {
        index =
          column_cards?.reduce((prev, curr) => {
            return prev?.index > curr?.index ? prev : curr;
          })?.index + 1;
      }
      setCards((old_cards) => {
        return [
          ...old_cards,
          {
            id: uuidv4(),
            list_id: col?.id,
            user_creator: user?.id,
            user_assigned: null,
            title: 'New Card',
            description: 'New Card',
            deadline: null,
            created_at: new Date().toISOString(),
            index: index,
          },
        ];
      });
    };

    const toggleEditModalVisibility = () => {
      if (editModalVisibility) {
        setCurrentEditCard(null);
      }
      setEditModalVisibility(!editModalVisibility.valueOf());
    };

    const onEditCardClick = (card: Card) => {
      setCurrentEditCard(card);
      toggleEditModalVisibility();
    };

    setColumnElements(
      columns?.map((col, index) => (
        <TaskColumn
          key={index}
          column={col}
          cards={cards
            ?.filter((card) => {
              return card.list_id === col.id;
            })
            .sort((card1, card2) => {
              return card1.index - card2.index;
            })}
          onEditCardClick={onEditCardClick}
          onAddCardClick={onAddCardClick}
          onEditColumn={onEditColumn}
          onDeleteColumn={onDeleteColumn}
        />
      )),
    );
    setBoardData({ cards, columns: columns || [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, cards, editModalVisibility, user?.id]);

  if (!columns) {
    return (
      <>
        <div className="bg-gray-500 h-full flex flex-col justify-center items-center">
          No Columns Found
        </div>
      </>
    );
  }

  // Handles moving cards
  function onDragEnd(result: DropResult) {
    const isDragInvalid =
      !result?.destination?.droppableId || !result.draggableId;
    if (isDragInvalid) {
      return;
    }
    const newCards = cards.map((c) => {
      let res: Card = undefined;
      const isDragInDifferentList =
        result?.source?.droppableId != result?.destination?.droppableId;
      const isDragInSameList =
        result?.source?.droppableId == result?.destination?.droppableId &&
        c.list_id == result?.destination?.droppableId;
      const isDragCard = c.id == result?.draggableId;
      const isCardAboveDragCardInDestinationList =
        c.list_id == result?.destination?.droppableId &&
        result?.destination &&
        c.index >= result?.destination?.index;
      const isCardAboveDragCardInSourceList =
        c.list_id == result?.source?.droppableId &&
        c.index >= result?.source?.index;
      const isCardBelowDragCard =
        result?.destination &&
        result?.source?.index > result?.destination?.index &&
        c.index <= result?.source?.index &&
        c.index >= result?.destination?.index;
      const isCardAboveDragCard =
        result?.destination &&
        result?.source.index < result?.destination?.index &&
        c.index >= result?.source?.index &&
        c.index <= result?.destination?.index;

      // If moving between lists
      if (isDragInDifferentList) {
        if (isDragCard) {
          // If card is the card being dragged
          res = {
            ...c,
            list_id: result?.destination?.droppableId,
            index: result?.destination?.index,
          };
        } else if (isCardAboveDragCardInDestinationList) {
          // If card is in the destination list and index is larger than destination index
          res = { ...c, index: c.index + 1 };
        } else if (isCardAboveDragCardInSourceList) {
          // If card is in the source list and index is larger than source index
          res = { ...c, index: c.index - 1 };
        }
      }
      // If moving cards in within the same list
      else if (isDragInSameList) {
        if (isDragCard) {
          // If card is the card being dragged
          res = {
            ...c,
            list_id: result?.destination?.droppableId,
            index: result?.destination?.index,
          };
        } else if (isCardBelowDragCard) {
          // If card is moving up a list
          res = { ...c, index: c.index + 1 };
        } else if (isCardAboveDragCard) {
          // If card is moving down a list
          res = { ...c, index: c.index - 1 };
        }
      }
      if (!res) {
        res = c;
      }

      return res;
    });
    setCards(newCards);
  }

  return (
    <>
      <div className="bg-gray-600 flex flex-row p-2 h-full overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex flex-row">{columnElements}</div>
        </DragDropContext>
        <div className="flex-none">
          <button
            className="bg-gray-500 rounded-md m-2 px-4 hover:bg-gray-700 text-white"
            onClick={onAddColumn}
          >
            + Add Column
          </button>
        </div>
      </div>
      <EditCardModal
        card={currentEditCard}
        onSaveCardClick={onSaveCardClick}
        onDeleteCardClick={onDeleteCardClick}
        isVisible={editModalVisibility}
        toggleIsVisible={toggleEditModalVisibility}
      />
    </>
  );
}
