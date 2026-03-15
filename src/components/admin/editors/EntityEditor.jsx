/**
 * EntityEditor — Tablo + Form entegrasyonu (tüm db.json koleksiyonları)
 * v5.2.0.0
 */
import { useState, useCallback } from 'react';
import { useAdmin } from '../AdminContext';
import { SCHEMAS } from '../schemas/entitySchemas';
import EntityTable from './EntityTable';
import EntityForm from './EntityForm';

export default function EntityEditor({ collection }) {
  const { db, updateEntity, addEntity, deleteEntity,
    updateEntityByIndex, addEntityRaw, deleteEntityByIndex } = useAdmin();
  const [editingId, setEditingId] = useState(null); // id or index
  const [isNew, setIsNew] = useState(false);

  const schema = SCHEMAS[collection];
  if (!schema) return <div className="admin-error">Bilinmeyen koleksiyon: {collection}</div>;

  const hasId = !schema.noId;
  const items = db[collection] || [];

  const handleEdit = useCallback((idOrIndex) => {
    setEditingId(idOrIndex);
    setIsNew(false);
  }, []);

  const handleAdd = useCallback(() => {
    /* Build empty item from schema */
    const empty = {};
    schema.fields.forEach(f => {
      if (f.type === 'readonly') return;
      if (f.trilingual) {
        empty[`${f.key}_tr`] = '';
        empty[`${f.key}_en`] = '';
        empty[`${f.key}_ar`] = '';
      } else if (f.type === 'boolean') {
        empty[f.key] = false;
      } else if (f.type === 'number') {
        empty[f.key] = null;
      } else if (f.type === 'ref-multi' || f.type === 'array-coords') {
        empty[f.key] = [];
      } else if (f.type === 'ref') {
        empty[f.key] = null;
      } else {
        empty[f.key] = '';
      }
    });
    setEditingId('__new__');
    setIsNew(true);
  }, [schema]);

  const handleSave = useCallback((draft) => {
    if (isNew) {
      if (hasId) {
        addEntity(collection, draft);
      } else {
        addEntityRaw(collection, draft);
      }
    } else {
      if (hasId) {
        updateEntity(collection, editingId, draft);
      } else {
        updateEntityByIndex(collection, editingId, draft);
      }
    }
    setEditingId(null);
    setIsNew(false);
  }, [isNew, hasId, collection, editingId, addEntity, addEntityRaw, updateEntity, updateEntityByIndex]);

  const handleDelete = useCallback((idOrIndex) => {
    const name = hasId
      ? (items.find(i => i.id === idOrIndex)?.tr || items.find(i => i.id === idOrIndex)?.n || `#${idOrIndex}`)
      : `#${idOrIndex}`;
    if (!confirm(`"${name}" silinecek. Emin misiniz?`)) return;
    if (hasId) {
      deleteEntity(collection, idOrIndex);
    } else {
      deleteEntityByIndex(collection, idOrIndex);
    }
  }, [hasId, items, collection, deleteEntity, deleteEntityByIndex]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setIsNew(false);
  }, []);

  /* Get current item for editing */
  const getEditItem = () => {
    if (isNew) {
      const empty = {};
      schema.fields.forEach(f => {
        if (f.type === 'readonly') return;
        if (f.trilingual) {
          empty[`${f.key}_tr`] = '';
          empty[`${f.key}_en`] = '';
          empty[`${f.key}_ar`] = '';
        } else if (f.type === 'boolean') {
          empty[f.key] = false;
        } else if (f.type === 'number') {
          empty[f.key] = null;
        } else if (f.type === 'ref-multi' || f.type === 'array-coords') {
          empty[f.key] = [];
        } else {
          empty[f.key] = '';
        }
      });
      return empty;
    }
    if (hasId) return items.find(i => i.id === editingId) || {};
    return items[editingId] || {};
  };

  return (
    <div className="admin-entity-editor">
      <div className="admin-entity-header">
        <h2 className="admin-section-title">
          {schema.icon} {schema.label.tr}
          <span className="admin-section-count">({items.length})</span>
        </h2>
      </div>

      {editingId != null ? (
        <EntityForm
          schema={schema}
          item={getEditItem()}
          onSave={handleSave}
          onCancel={handleCancel}
          isNew={isNew}
        />
      ) : (
        <EntityTable
          collection={collection}
          schema={schema}
          onEdit={handleEdit}
          onAdd={handleAdd}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
