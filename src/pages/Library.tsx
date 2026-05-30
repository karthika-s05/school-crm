import { useEffect, useState } from 'react';
import { Search, Plus, X, Library as LibraryIcon, BookOpen } from 'lucide-react';
import { api } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Library() {
  const [books, setBooks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'books' | 'issues'>('books');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [bRes, iRes, sRes] = await Promise.all([api.get<ApiResponse>('/library'), api.get<ApiResponse>('/library/issues'), api.get<ApiResponse>('/students')]);
      setBooks(bRes.data || []);
      setIssues(iRes.data || []);
      setStudents(sRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..." className="outline-none text-sm" />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setTab('books')} className={`px-4 py-1.5 text-sm rounded-md ${tab === 'books' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Books</button>
          <button onClick={() => setTab('issues')} className={`px-4 py-1.5 text-sm rounded-md ${tab === 'issues' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Issues</button>
        </div>
      </div>

      {tab === 'books' ? (
        filteredBooks.length === 0 ? <EmptyState message="No books found" icon={BookOpen} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><BookOpen size={20} className="text-amber-600" /></div>
                <h4 className="font-semibold text-gray-900 text-sm">{b.title}</h4>
                <p className="text-xs text-gray-500">{b.author}</p>
                <p className="text-xs text-gray-400 mt-1">{b.category}</p>
                <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-xs">
                  <span className="text-gray-400">Available: {b.available_copies}/{b.total_copies}</span>
                  <Badge variant={b.available_copies > 0 ? 'success' : 'danger'}>{b.available_copies > 0 ? 'Available' : 'Issued'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <SectionCard title="Issued Books">
          {issues.length === 0 ? <EmptyState message="No issued books" icon={LibraryIcon} /> : (
            <div className="space-y-2">
              {issues.map(i => (
                <div key={i.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div><p className="font-medium text-sm">{i.book_title || i.book_id}</p><p className="text-xs text-gray-400">{i.student_name || i.student_id}</p></div>
                  <div className="text-right"><Badge variant={i.status === 'issued' ? 'warning' : 'success'}>{i.status}</Badge><p className="text-xs text-gray-400 mt-1">Due: {i.due_date}</p></div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
