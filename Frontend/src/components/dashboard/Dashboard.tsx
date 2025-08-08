import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store';
import { selectCurrentUser, selectIsAdmin, selectIsEditor, selectIsAuthor, selectIsReviewer } from '../../store/slices/authSlice';

const getRoleDisplayName = (role: string | null | undefined): string => {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Administrador';
    case 'ROLE_EDITOR':
      return 'Editor';
    case 'ROLE_AUTOR':
      return 'Autor';
    case 'ROLE_REVISOR':
      return 'Revisor';
    case 'ROLE_READER':
      return 'Lector';
    default:
      return 'Usuario';
  }
};

const Dashboard: React.FC = () => {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isEditor = useAppSelector(selectIsEditor);
  const isAuthor = useAppSelector(selectIsAuthor);
  const isReviewer = useAppSelector(selectIsReviewer);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido/a, {user?.firstName}!
        </h1>
        <p className="text-blue-100">
          Esto es lo que está pasando en tu panel hoy.
        </p>
        <p className="text-sm text-blue-200 mt-1">
          Rol: {getRoleDisplayName(user?.role)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Publicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 desde la semana pasada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +1 desde el mes pasado
            </p>
          </CardContent>
        </Card>

        {isReviewer && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisiones Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Asignadas a ti
              </p>
            </CardContent>
          </Card>
        )}

        {(isEditor || isAdmin) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Aprobar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Requieren tu aprobación
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Publicaciones Recientes</CardTitle>
            <CardDescription>
              Tu actividad de publicación más reciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                No hay publicaciones recientes. ¡Crea tu primera publicación para comenzar!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {isReviewer ? 'Revisiones Recientes' : 'Actividad Reciente'}
            </CardTitle>
            <CardDescription>
              {isReviewer ? 'Revisiones asignadas a ti' : 'Tu actividad reciente en el sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {isReviewer 
                  ? 'No hay revisiones pendientes en este momento.'
                  : 'No hay actividad reciente para mostrar.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Acciones basadas en tu rol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/publications" className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <h3 className="font-medium text-slate-900">Mis Publicaciones</h3>
              <p className="text-sm text-slate-600">Ver y gestionar mis publicaciones</p>
            </Link>
            {isAuthor && (
              <Link to="/publications/new" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <h3 className="font-medium text-blue-900">Nueva Publicación</h3>
                <p className="text-sm text-blue-600">Crear una nueva publicación</p>
              </Link>
            )}
            {isReviewer && (
              <Link to="/reviews" className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <h3 className="font-medium text-green-900">Ver Revisiones</h3>
                <p className="text-sm text-green-600">Revisar publicaciones asignadas</p>
              </Link>
            )}
            {(isEditor || isAdmin) && (
              <Link to="/editorial" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <h3 className="font-medium text-purple-900">Panel Editorial</h3>
                <p className="text-sm text-purple-600">Gestionar publicaciones</p>
              </Link>
            )}
            <Link to="/catalog" className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <h3 className="font-medium text-orange-900">Catálogo</h3>
              <p className="text-sm text-orange-600">Explorar publicaciones publicadas</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;