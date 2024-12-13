import Button from 'components/base/Button';
import { Col, Flexbox, Row } from 'components/base/Layout';
import Tooltip from 'components/base/Tooltip';
import CubeContext from 'contexts/CubeContext';
import React, { useContext, useMemo } from 'react';
import { ORDERED_SORTS, SORTS } from 'utils/Sort';
import Select from './base/Select';
import Collapse from './base/Collapse';

interface SortCollapseProps {
  isOpen: boolean;
}

const SortCollapse: React.FC<SortCollapseProps> = ({ isOpen }) => {
  const {
    canEdit,
    cube,
    setShowUnsorted,
    saveSorts,
    resetSorts,
    sortPrimary,
    sortSecondary,
    sortTertiary,
    sortQuaternary,
    setSortPrimary,
    setSortSecondary,
    setSortTertiary,
    setSortQuaternary,
  } = useContext(CubeContext);

  const sortsModified = useMemo(() => {
    return (
      sortPrimary !== (cube.defaultSorts[0] || 'Color Category') ||
      sortSecondary !== (cube.defaultSorts[1] || 'Types-Multicolor') ||
      sortTertiary !== (cube.defaultSorts[2] || 'Mana Value') ||
      sortQuaternary !== (cube.defaultSorts[3] || 'Alphabetical')
    );
  }, [sortPrimary, cube.defaultSorts, sortSecondary, sortTertiary, sortQuaternary]);

  return (
    <Collapse isOpen={isOpen}>
      <Flexbox direction="col" gap="2">
        <Row>
          <Col xs={12} sm={6} className="mt-2">
            <Select
              label="Primary Sort"
              value={sortPrimary || 'Color Category'}
              setValue={setSortPrimary}
              options={SORTS.map((sort) => ({ value: sort, label: sort }))}
            />
          </Col>
          <Col xs={12} sm={6} className="mt-2">
            <Select
              label="Secondary Sort"
              value={sortSecondary || 'Types-Multicolor'}
              setValue={setSortSecondary}
              options={SORTS.map((sort) => ({ value: sort, label: sort }))}
            />
          </Col>
          <Col xs={12} sm={6} className="mt-2">
            <Select
              label="Tertiary Sort"
              value={sortTertiary || 'Mana Value'}
              setValue={setSortTertiary}
              options={SORTS.map((sort) => ({ value: sort, label: sort }))}
            />
          </Col>
          <Col xs={12} sm={6} className="mt-2">
            <Select
              label="Quaternary Sort"
              value={sortQuaternary || 'Alphabetical'}
              setValue={setSortQuaternary}
              options={ORDERED_SORTS.map((sort) => ({ value: sort, label: sort }))}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <p className="my-2">
              <em>
                Cards will appear as duplicates if they fit in multiple categories. The counts will still only count
                each item once.
              </em>
            </p>
          </Col>
        </Row>
        <Flexbox direction="row" gap="2">
          <Button color="accent" className="me-sm-2 mb-3" onClick={resetSorts} disabled={!sortsModified}>
            Reset Sort
          </Button>
          {canEdit && (
            <Button color="accent" className="me-sm-2 mb-3" onClick={saveSorts} disabled={!sortsModified}>
              Save as Default Sort
            </Button>
          )}
          <Button
            color={cube.showUnsorted ? 'danger' : 'primary'}
            className="me-sm-2 mb-3"
            onClick={() => setShowUnsorted(!cube.showUnsorted)}
          >
            <Tooltip text="Creates a separate column for cards that would be hidden otherwise.">
              {cube.showUnsorted ? 'Hide' : 'Show'} Unsorted cards
            </Tooltip>
          </Button>
        </Flexbox>
      </Flexbox>
    </Collapse>
  );
};

export default SortCollapse;
