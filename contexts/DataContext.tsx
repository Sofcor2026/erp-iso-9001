import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Document, KPI, User, DocumentStatus, Permission } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextType {
  documents: Document[];
  kpis: KPI[];
  expiringDocuments: Document[];
  loading: boolean;
  fetchData: () => Promise<void>;
  updateDocumentStatus: (docId: string, status: Document['estado'], actor: User) => Promise<void>;
  updateDocument: (docId: string, data: Partial<Omit<Document, 'id'>>) => Promise<void>;
  addDocument: (doc: Document) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [expiringDocuments, setExpiringDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const permissions = user.role.permissions || [];
      const [docs, kpisData] = await Promise.all([
        api.getDocuments(permissions),
        api.getKPIs(),
      ]);
      setDocuments(docs);
      setKpis(kpisData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (documents.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiring = documents.filter(doc => {
        if (doc.estado !== DocumentStatus.VIGENTE) {
          return false;
        }
        
        const [year, month, day] = doc.fechaRevision.split('-').map(Number);
        const revisionDate = new Date(year, month - 1, day);
        revisionDate.setHours(0, 0, 0, 0);

        return revisionDate >= today && revisionDate <= thirtyDaysFromNow;
      });

      setExpiringDocuments(expiring);
    }
  }, [documents]);

  const updateDocumentStatus = async (docId: string, status: Document['estado'], actor: User) => {
    try {
      const updatedDoc = await api.updateDocumentStatus(docId, status, actor);
      setDocuments(prevDocs => 
          prevDocs.map(doc => doc.id === docId ? updatedDoc : doc)
      );
    } catch(error) {
        console.error("Failed to update document status", error);
        // In a real app, you might want to show a notification to the user
    }
  };

  const updateDocument = async (docId: string, data: Partial<Omit<Document, 'id'>>) => {
    if (!user) throw new Error("User not authenticated for update");
    try {
      const updatedDoc = await api.updateDocument(docId, data, user);
      setDocuments(prevDocs => 
          prevDocs.map(doc => doc.id === docId ? updatedDoc : doc)
      );
    } catch(error) {
        console.error("Failed to update document", error);
        throw error;
    }
  };


  const addDocument = (doc: Document) => {
    setDocuments(prevDocs => [doc, ...prevDocs]);
  };

  return (
    <DataContext.Provider value={{ documents, kpis, loading, fetchData, updateDocumentStatus, addDocument, updateDocument, expiringDocuments }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};