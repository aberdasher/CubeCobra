import React, { Dispatch, SetStateAction, useCallback, useContext, useRef, useState } from 'react';
import {
  Button,
  Col,
  Collapse,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Row,
  UncontrolledAlert,
  UncontrolledAlertProps,
} from 'reactstrap';

import AutocompleteInput from 'components/AutocompleteInput';
import Changelist from 'components/Changelist';
import LoadingButton from 'components/LoadingButton';
import TextEntry from 'components/TextEntry';
import CubeContext from 'contexts/CubeContext';
import DisplayContext, { DisplayContextValue } from 'contexts/DisplayContext';
import { BoardType } from 'datatypes/Card';
import CardDetails from 'datatypes/CardDetails';
import useLocalStorage from 'hooks/useLocalStorage';
import { csrfFetch } from 'utils/CSRF';

interface GetCardResponse {
  success: 'true' | 'false';
  card: CardDetails;
}

export const getCard = async (
  defaultprinting: string,
  name: string,
  setAlerts?: Dispatch<SetStateAction<UncontrolledAlertProps[]>>,
): Promise<CardDetails | null> => {
  if (name && name.length > 0) {
    const response = await csrfFetch(`/cube/api/getcardforcube`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        defaultprinting,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const message = `Couldn't get card: ${response.status}.`;
      if (setAlerts) {
        setAlerts((alerts: UncontrolledAlertProps[]) => [...alerts, { color: 'danger', message }]);
      } else {
        console.error(message);
      }
      return null;
    }

    const json: GetCardResponse = await response.json();
    if (json.success !== 'true' || !json.card) {
      const message = `Couldn't find card [${name}].`;
      if (setAlerts) {
        setAlerts((alerts: UncontrolledAlertProps[]) => [...alerts, { color: 'danger', message }]);
      } else {
        console.error(message);
      }
      return null;
    }
    return json.card;
  }
  return null;
};

const DEFAULT_BLOG_TITLE = 'Cube Updated – Automatic Post';

interface EditCollapseProps {
  isOpen: boolean;
}

const EditCollapse: React.FC<EditCollapseProps> = ({ isOpen }) => {
  const [addValue, setAddValue] = useState('');
  const [removeValue, setRemoveValue] = useState('');
  const { showMaybeboard, toggleShowMaybeboard } = useContext(DisplayContext) as DisplayContextValue;
  const addRef = useRef<HTMLInputElement>(null);
  const removeRef = useRef<HTMLInputElement>(null);

  const {
    cube,
    changes,
    addCard,
    removeCard,
    swapCard,
    changedCards,
    discardAllChanges,
    commitChanges,
    alerts,
    setAlerts,
    loading,
    useBlog,
    setUseBlog,
  } = useContext(CubeContext)!;

  const [postContent, setPostContent] = useLocalStorage(`${cube.id}-blogpost`, '');
  const [postTitle, setPostTitle] = useLocalStorage(`${cube.id}-blogtitle`, DEFAULT_BLOG_TITLE);
  const [activeBoard, setActiveBoard] = useLocalStorage<BoardType>(`${cube.id}-useMaybeboard`, 'mainboard');
  const [specifyEdition, setSpecifyEdition] = useLocalStorage(`${cube.id}-specifyEdition`, false);

  const boardToEdit = showMaybeboard ? activeBoard : 'mainboard';

  const handleAdd = useCallback(
    async (event: React.FormEvent, match: string) => {
      event.preventDefault();
      try {
        const card = await getCard(cube.defaultPrinting, match, setAlerts);
        if (!card) {
          return;
        }
        addCard(
          { cardID: card.scryfall_id, addedTmsp: new Date().valueOf().toString(), status: cube.defaultStatus },
          boardToEdit,
        );
        setAddValue('');

        if (addRef.current) {
          addRef.current.focus();
        }
      } catch (e) {
        console.error(e);
      }
    },
    [cube.defaultPrinting, cube.defaultStatus, setAlerts, addCard, boardToEdit],
  );

  const handleRemoveReplace = useCallback(
    async (event: React.FormEvent, match: string) => {
      event.preventDefault();
      const replace = addValue.length > 0;
      try {
        let removeIndex = -1;
        const board = changedCards[boardToEdit];
        for (let i = 0; i < board.length; i++) {
          const card = board[i];
          if (
            !card.markedForDelete &&
            card.index !== undefined &&
            card.details?.name.toLowerCase() === match.toLowerCase()
          ) {
            removeIndex = card.index;
          }
        }

        if (removeIndex === -1) {
          setAlerts((items) => [
            ...items,
            {
              color: 'danger',
              message: `Couldn't find a card with name "${match}" in "${boardToEdit}".`,
            },
          ]);
          return;
        }

        if (replace) {
          const card = await getCard(cube.defaultPrinting, addValue, setAlerts);
          if (!card) {
            return;
          }
          swapCard(
            removeIndex,
            { cardID: card.scryfall_id, addedTmsp: new Date().valueOf().toString(), status: cube.defaultStatus },
            boardToEdit,
          );
        } else {
          removeCard(removeIndex, boardToEdit);
        }

        setAddValue('');
        setRemoveValue('');

        const focus = replace ? addRef : removeRef;
        if (focus.current) {
          focus.current.focus();
        }
      } catch (e) {
        console.error(e);
      }
    },
    [addValue, changedCards, boardToEdit, setAlerts, cube.defaultPrinting, cube.defaultStatus, swapCard, removeCard],
  );

  const submit = useCallback(async () => {
    commitChanges(postTitle, postContent);
    setPostTitle(DEFAULT_BLOG_TITLE);
    setPostContent('');
  }, [commitChanges, postContent, postTitle, setPostContent, setPostTitle]);

  return (
    <Collapse className="px-3" isOpen={isOpen}>
      {alerts.map(({ color, message }, index) => (
        <UncontrolledAlert key={index} color={color} className="mt-2">
          {message}
        </UncontrolledAlert>
      ))}
      <Row className="mb-2">
        {showMaybeboard && (
          <Col xs={12} md={3}>
            <InputGroup className="mb-1">
              <Input disabled value="Board" />
              <Input
                value={activeBoard}
                onChange={(e) => setActiveBoard(e.target.value as BoardType)}
                name="select"
                type="select"
              >
                <option value="mainboard">Mainboard</option>
                <option value="maybeboard">Maybeboard</option>
              </Input>
            </InputGroup>
          </Col>
        )}
        <Col xs={12} md={3}>
          <InputGroup className="mb-1">
            <AutocompleteInput
              treeUrl={specifyEdition ? '/cube/api/fullnames' : '/cube/api/cardnames'}
              treePath="cardnames"
              type="text"
              innerRef={addRef}
              name="add"
              value={addValue}
              setValue={setAddValue}
              onSubmit={(e) => handleAdd(e, removeValue)}
              placeholder="Card to Add"
              autoComplete="off"
              data-lpignore
              className="square-right"
            />
            <Button color="accent" disabled={addValue.length === 0} onClick={(e) => handleAdd(e, addValue)}>
              Add
            </Button>
          </InputGroup>
        </Col>
        <Col xs={12} md={4}>
          <InputGroup className="flex-nowrap mb-1">
            <AutocompleteInput
              cubeId={cube.id}
              treeUrl={`/cube/api/cubecardnames/${cube.id}/${boardToEdit}`}
              treePath="cardnames"
              type="text"
              innerRef={removeRef}
              name="remove"
              value={removeValue}
              setValue={setRemoveValue}
              onSubmit={(e) => handleRemoveReplace(e, removeValue)}
              placeholder="Card to Remove"
              autoComplete="off"
              data-lpignore
              className="square-right"
            />
            <Button
              color="accent"
              disabled={removeValue.length === 0}
              onClick={(e) => handleRemoveReplace(e, removeValue)}
            >
              Remove/Replace
            </Button>
          </InputGroup>
        </Col>
      </Row>
      <Row className="mb-2">
        <Col xs={12} md={2}>
          <InputGroup className="mb-1">
            <InputGroupText>
              <Input
                addon
                type="checkbox"
                aria-label="Checkbox for following text input"
                checked={specifyEdition}
                onChange={() => setSpecifyEdition(!specifyEdition)}
              />
            </InputGroupText>
            <Input disabled value="Specify Versions" />
          </InputGroup>
        </Col>
        <Col xs={12} md={2}>
          <InputGroup className="mb-1">
            <InputGroupText>
              <Input
                addon
                type="checkbox"
                aria-label="Checkbox for following text input"
                checked={showMaybeboard}
                onChange={toggleShowMaybeboard}
              />
            </InputGroupText>
            <Input disabled value="Use Maybeboard" />
          </InputGroup>
        </Col>
        <Col xs={12} md={2}>
          <InputGroup className="mb-1">
            <InputGroupText>
              <Input
                addon
                type="checkbox"
                aria-label="Checkbox for following text input"
                checked={useBlog}
                onChange={() => setUseBlog(!useBlog)}
              />
            </InputGroupText>
            <Input disabled value="Create Blog Post" />
          </InputGroup>
        </Col>
      </Row>
      <Collapse
        isOpen={
          Object.values(changes.mainboard).some((c) => c.length > 0) ||
          Object.values(changes.maybeboard).some((c) => c.length > 0)
        }
        className="pt-1"
      >
        <Row>
          <Col xs="12" md="6">
            <Changelist />
          </Col>
          {useBlog && (
            <Col xs="12" md="6">
              <h6>Blog Post</h6>
              <FormGroup>
                <Label className="visually-hidden">Blog title</Label>
                <Input type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label className="visually-hidden">Blog body</Label>
                <TextEntry
                  name="blog"
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  maxLength={10000}
                />
              </FormGroup>
            </Col>
          )}
        </Row>
        <Row className="mb-2">
          <Col xs={6} md="3">
            <LoadingButton color="accent" block onClick={submit} loading={loading}>
              Save Changes
            </LoadingButton>
          </Col>
          <Col xs={6} md="3">
            <Button
              color="unsafe"
              block
              onClick={() => {
                discardAllChanges();
                setPostTitle(DEFAULT_BLOG_TITLE);
                setPostContent('');
              }}
            >
              Discard All
            </Button>
          </Col>
        </Row>
      </Collapse>
    </Collapse>
  );
};

export default EditCollapse;
