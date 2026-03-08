import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, GripVertical, Download } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api, { API_BASE } from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ClientForm from './ClientForm';
import { CLIENT_STAGES, CLIENT_SOURCES, getStatusInfo, formatDate } from '../../utils/constants';
import clsx from 'clsx';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await api.get('/clients', { params: { search, limit: 200 } });
      setClients(data.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;

    setClients((prev) =>
      prev.map((c) => (c.id === draggableId ? { ...c, stage: newStage } : c))
    );

    try {
      await api.patch(`/clients/${draggableId}/stage`, {
        stage: newStage,
        stageOrder: destination.index,
      });
    } catch {
      fetchClients();
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditClient(null);
    fetchClients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Клиенты и лиды</h1>
        <div className="flex items-center gap-2">
          <a
            href={`${API_BASE}/export/clients`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            <Download className="w-4 h-4" />
            Excel
          </a>
          <button
            onClick={() => { setEditClient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Новый клиент
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск клиентов..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={clsx('p-2 rounded-md transition', view === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-500')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={clsx('p-2 rounded-md transition', view === 'list' ? 'bg-white shadow-sm' : 'text-gray-500')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {CLIENT_STAGES.map((stage) => {
              const stageClients = clients.filter((c) => c.stage === stage.value);
              return (
                <Droppable droppableId={stage.value} key={stage.value}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={clsx(
                        'min-w-[280px] w-[280px] bg-gray-100 rounded-xl p-3',
                        snapshot.isDraggingOver && 'bg-primary-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">{stage.label}</h3>
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                          {stageClients.length}
                        </span>
                      </div>
                      <div className="space-y-2 min-h-[60px]">
                        {stageClients.map((client, index) => (
                          <Draggable key={client.id} draggableId={client.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow transition cursor-pointer"
                              >
                                <Link to={`/clients/${client.id}`}>
                                  <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                  {client.companyName && (
                                    <p className="text-xs text-gray-500 mt-0.5">{client.companyName}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    {client.source && (
                                      <span className="text-[10px] text-gray-400">
                                        {getStatusInfo(CLIENT_SOURCES.map((s) => ({ ...s, color: 'gray' })), client.source).label}
                                      </span>
                                    )}
                                    {client.manager && (
                                      <span className="text-[10px] text-gray-400 ml-auto">
                                        {client.manager.name}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        /* Список */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Имя / Компания</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Контакты</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Этап</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Источник</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Менеджер</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => {
                const stageInfo = getStatusInfo(CLIENT_STAGES, c.stage);
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {c.name}
                      </Link>
                      {c.companyName && <p className="text-xs text-gray-400">{c.companyName}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.email && <div>{c.email}</div>}
                      {c.phone && <div>{c.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={stageInfo.color}>{stageInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.source ? getStatusInfo(CLIENT_SOURCES.map((s) => ({ ...s, color: 'gray' })), c.source).label : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.manager?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Форма создания */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editClient ? 'Редактировать клиента' : 'Новый клиент'} size="lg">
        <ClientForm client={editClient} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}
