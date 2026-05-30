import { useEffect, useState } from 'react';
import { BookOpen, Search, Library as LibraryIcon, User, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../lib/supabase';
import {
  PageHeader, SectionCard, Badge, LoadingSpinner, EmptyState,
  SearchInput, Tabs, Card, Avatar
} from '../components/ui';

type ApiResponse = { success: boolean; data: any };

export default function Library() {
  const [books, setBooks] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'books' | 'issues'>('books');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [bRes, iRes] = await Promise.all([
        api.get<ApiResponse>('/library'),
        api.get<ApiResponse>('/library/issues'),
      ]);
      setBooks(bRes.data || []);
      setIssues(iRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author || '').toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = books.filter(b => b.available_copies > 0).length;
  const issuedCount = issues.filter(i => i.status === 'issued').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        subtitle={`${books.length} books, ${issuedCount} currently issued`}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search books by title or author..."
          className="max-w-sm"
        />
        <Tabs
          tabs={[
            { id: 'books', label: 'Books' },
            { id: 'issues', label: 'Issued Books' },
          ]}
          activeTab={tab}
          onChange={(id) => setTab(id as 'books' | 'issues')}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tab === 'books' ? (
        filteredBooks.length === 0 ? (
          <EmptyState message="No books found" icon={BookOpen} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map(book => (
              <Card key={book.id} className="p-5" hover>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={24} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{book.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{book.author || 'Unknown Author'}</p>
                    <p className="text-xs text-gray-400 mt-1">{book.category || 'General'}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Available: </span>
                    <span className={`font-medium ${book.available_copies > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {book.available_copies}/{book.total_copies}
                    </span>
                  </div>
                  <Badge variant={book.available_copies > 0 ? 'success' : 'danger'} size="sm">
                    {book.available_copies > 0 ? 'Available' : 'Issued'}
                  </Badge>
                </div>

                {book.isbn && (
                  <p className="text-xs text-gray-400 mt-2">ISBN: {book.isbn}</p>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        <SectionCard title={`Issued Books (${issues.length})`}>
          {issues.length === 0 ? (
            <EmptyState message="No books currently issued" icon={LibraryIcon} />
          ) : (
            <div className="space-y-3">
              {issues.map(issue => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <BookOpen size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{issue.book_title || 'Unknown Book'}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User size={10} />
                        {issue.student_name || 'Unknown Student'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={issue.status === 'issued' ? 'warning' : 'success'}>
                      {issue.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                      <Calendar size={10} />
                      Due: {issue.due_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
