import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, Settings, ToggleLeft, ToggleRight } from 'lucide-react';

// Sortable widget item
function SortableWidgetItem({ widget, onEdit, onDelete, onDuplicate, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl p-4 border flex items-center gap-3 transition-shadow hover:shadow-md ${
        widget.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-300 cursor-move hover:text-slate-500 p-1"
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-700 text-sm truncate">
          {widget.name}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {widget.type} · {widget.enabled ? '✅ Активний' : '⏸ Вимкнений'}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggle(widget)}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600"
          title={widget.enabled ? 'Вимкнути' : 'Увімкнути'}
        >
          {widget.enabled ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
        </button>
        <button
          onClick={() => onDuplicate(widget)}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600"
          title="Дублювати"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={() => onEdit(widget)}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600"
          title="Редагувати"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => onDelete(widget)}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500"
          title="Видалити"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Main DragDropBuilder component
export default function DragDropBuilder({
  widgets,
  onReorder,
  onEdit,
  onDelete,
  onDuplicate,
  onToggle,
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      onReorder(newWidgets);
    }

    setActiveId(null);
  }

  const activeWidget = widgets.find((w) => w.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={widgets.map((w) => w.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {widgets.map((widget) => (
            <SortableWidgetItem
              key={widget.id}
              widget={widget}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onToggle={onToggle}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeWidget ? (
          <div className="bg-white rounded-xl p-4 border border-blue-300 shadow-xl flex items-center gap-3 opacity-90">
            <GripVertical size={18} className="text-blue-400" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-700 text-sm truncate">
                {activeWidget.name}
              </div>
              <div className="text-xs text-slate-400">{activeWidget.type}</div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
