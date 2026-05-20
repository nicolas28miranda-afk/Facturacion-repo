import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Button } from './Button';
import { PencilSquareIcon, TrashIcon } from './icons';
import { usuarioService, UsuarioRegistro, PerfilResponse, EmpleadoConsulta } from '../services/usuarioService';

interface UserSearchData {
  usuario: string;
}

interface NewUserData {
  noUsuario: string;
  nombreEmpleado: string;
  password: string;
  idPerfil: string;
  idDfi: string;
  idEstacionamiento: string; // Tienda (opcional)
}

interface EditUserData {
  noUsuario: string;
  nombreEmpleado: string;
  idPerfil: string;
  nombrePerfil: string;
}

const initialUserSearchData: UserSearchData = {
  usuario: 'j.perez',
};

const initialNewUserData: NewUserData = {
  noUsuario: '',
  nombreEmpleado: '',
  password: '',
  idPerfil: '',
  idDfi: '',
  idEstacionamiento: '', // Tienda (opcional)
};

const initialEditUserData: EditUserData = {
  noUsuario: '',
  nombreEmpleado: '',
  idPerfil: '',
  nombrePerfil: '',
};

export const AdminEmpleadosPage: React.FC = () => {
  const [userSearch, setUserSearch] = useState<UserSearchData>(initialUserSearchData);
  const [newUser, setNewUser] = useState<NewUserData>(initialNewUserData);
  const [editUser, setEditUser] = useState<EditUserData>(initialEditUserData);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [perfilesFromDB, setPerfilesFromDB] = useState<PerfilResponse[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoConsulta[]>([]);
  const [isLoadingEmpleados, setIsLoadingEmpleados] = useState(false);

  const dummyFile = new File(['jperez\nmgomez\nasanchez'], 'usuarios_a_eliminar.csv', { type: 'text/csv' });
  const [massDeleteFile, _setMassDeleteFile] = useState<File | null>(dummyFile);

  // Los empleados solo se cargarán cuando se haga una búsqueda específica

  // Cargar perfiles desde el backend
  useEffect(() => {
    const cargarPerfiles = async () => {
      try {
        const perfiles = await usuarioService.obtenerPerfiles();
        setPerfilesFromDB(perfiles);
      } catch (error) {
        console.error('Error al cargar perfiles:', error);
      }
    };
    
    if (showModal || showEditModal) {
      cargarPerfiles();
    }
  }, [showModal, showEditModal]);

  // Opciones para los campos del formulario basadas en la base de datos
  const PERFIL_OPTIONS_DB = perfilesFromDB
    .filter(perfil => perfil && perfil.idPerfil && perfil.nombrePerfil)
    .map(perfil => ({
      value: perfil.idPerfil.toString(),
      label: perfil.nombrePerfil
    }));

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch({ ...userSearch, [e.target.name]: e.target.value });
  };

  // Función no utilizada - comentada para evitar error de TypeScript
  // const cargarEmpleados = async () => {
  //   setIsLoadingEmpleados(true);
  //   try {
  //     const empleadosData = await usuarioService.consultarEmpleados();
  //     setEmpleados(empleadosData);
  //   } catch (error) {
  //     console.error('Error al cargar empleados:', error);
  //   } finally {
  //     setIsLoadingEmpleados(false);
  //   }
  // };

  const cargarEmpleadosEspecificos = async (usuario: string) => {
    setIsLoadingEmpleados(true);
    try {
      const empleadosData = await usuarioService.consultarEmpleadosEspecificos(usuario);
      setEmpleados(empleadosData);
      
      if (empleadosData.length === 0) {
        const esBusquedaManual = userSearch.usuario === usuario;
        if (esBusquedaManual) {
          alert(`No se encontraron empleados que coincidan con "${usuario}"`);
        }
      }
    } catch (error) {
      console.error('Error al buscar empleados:', error);
      alert('Error al buscar empleados. Por favor intenta nuevamente.');
    } finally {
      setIsLoadingEmpleados(false);
    }
  };

  const handleConsultarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Solo buscar si hay un usuario específico ingresado
    if (!userSearch.usuario || userSearch.usuario.trim() === '') {
      alert('Por favor ingresa un código de usuario específico para buscar (ej: admin, jcredito01)');
      return;
    }
    
    // Ejecutar la consulta con el usuario específico
    cargarEmpleadosEspecificos(userSearch.usuario.trim());
  };

  const handleAltaUsuario = () => {
    setShowModal(true);
  };

  const handleEditUsuario = (empleado: EmpleadoConsulta) => {
    if (!empleado) {
      console.error('Empleado no definido');
      return;
    }
    
    // Buscar el ID del perfil basado en el nombre del perfil
    const perfilEncontrado = PERFIL_OPTIONS_DB.find(perfil => perfil.label === empleado.nombrePerfil);
    
    setEditUser({
      noUsuario: empleado.noUsuario || '',
      nombreEmpleado: empleado.nombreEmpleado || '',
      idPerfil: perfilEncontrado ? perfilEncontrado.value : '',
      nombrePerfil: empleado.nombrePerfil || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteUsuario = async (noUsuario: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar el usuario "${noUsuario}"?\n\nEsta acción cambiará el estatus del usuario a INACTIVO.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      const currentUser = localStorage.getItem('username') || 'admin';
      const response = await usuarioService.eliminarUsuario(noUsuario, currentUser);
      
      if (response.success) {
        alert(`Usuario ${noUsuario} eliminado correctamente`);
        // Recargar la lista de empleados
        if (userSearch.usuario && userSearch.usuario.trim() !== '') {
          cargarEmpleadosEspecificos(userSearch.usuario.trim());
        }
      } else {
        alert(`Error al eliminar usuario: ${response.message}`);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar usuario. Por favor intenta nuevamente.');
    }
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleEditUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewUser(initialNewUserData);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditUser(initialEditUserData);
    setSubmitError('');
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const usuarioData: UsuarioRegistro = {
        noUsuario: newUser.noUsuario,
        nombreEmpleado: newUser.nombreEmpleado,
        password: newUser.password,
        estatusUsuario: 'ACTIVO', // Valor por defecto
        idPerfil: parseInt(newUser.idPerfil),
        idDfi: newUser.idDfi ? parseInt(newUser.idDfi) : undefined,
        idEstacionamiento: newUser.idEstacionamiento ? parseInt(newUser.idEstacionamiento) : undefined,
        modificaUbicacion: 'N' // Valor por defecto
      };
      
      const response = await usuarioService.registrarUsuario(usuarioData);
      
      if (response.success) {
        alert(`Usuario ${newUser.noUsuario} creado exitosamente`);
        handleCloseModal();
        
        setUserSearch({ usuario: newUser.noUsuario });
        
        const buscarUsuarioConRetry = async (intento: number = 1) => {
          const empleadosData = await usuarioService.consultarEmpleadosEspecificos(newUser.noUsuario);
          
          if (empleadosData.length > 0) {
            setEmpleados(empleadosData);
          } else if (intento < 3) {
            setTimeout(() => {
              buscarUsuarioConRetry(intento + 1);
            }, 500 * intento);
          } else {
            alert(`Usuario creado exitosamente. Si no aparece en la tabla, por favor busca manualmente con el código: ${newUser.noUsuario}`);
          }
        };
        
        setTimeout(() => {
          buscarUsuarioConRetry(1);
        }, 500);
      } else {
        setSubmitError(response.message || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setSubmitError('Error al crear usuario. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const currentUser = localStorage.getItem('username') || 'admin';
      const response = await usuarioService.actualizarPerfil(
        editUser.noUsuario,
        parseInt(editUser.idPerfil),
        currentUser
      );
      
      if (response.success) {
        alert(`Perfil del usuario ${editUser.noUsuario} actualizado correctamente`);
        handleCloseEditModal();
        // Recargar empleados si hay una búsqueda activa
        if (userSearch.usuario && userSearch.usuario.trim() !== '') {
          cargarEmpleadosEspecificos(userSearch.usuario.trim());
        }
      } else {
        setSubmitError(response.message || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setSubmitError('Error al actualizar perfil. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función no utilizada - comentada para evitar error de TypeScript
  // const handleFileChange = (file: File | null) => {
  //   setMassDeleteFile(file);
  // };

  const handleMassDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (massDeleteFile) {
      alert(`Procesando eliminación masiva con archivo: ${massDeleteFile.name} (simulado)`);
    } else {
      alert('Por favor, seleccione un archivo para la eliminación masiva.');
    }
  };
  
  const fileHelpText = "El archivo debe contener los identificadores de los usuarios a eliminar, uno por línea.";

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 sr-only">
        ADMINISTRACIÓN DE EMPLEADOS
      </h2>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          BUSCAR DATOS DE USUARIO
        </h3>
        <form onSubmit={handleConsultarUsuario} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
            <FormField
              label="Código de Usuario:"
              name="usuario"
              value={userSearch.usuario}
              onChange={handleUserSearchChange}
              placeholder="Ej: admin, jcredito01, supervisor01..."
              className="md:col-span-2"
            />
            <div className="flex space-x-3">
              <Button type="submit" variant="primary" className="w-full md:w-auto">
                Consultar
              </Button>
              <Button type="button" onClick={handleAltaUsuario} variant="secondary" className="w-full md:w-auto">
                Alta
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Tabla de Empleados */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            DATOS CONSULTADOS
          </h3>
          <Button 
            type="button" 
            onClick={() => {
              if (!userSearch.usuario || userSearch.usuario.trim() === '') {
                alert('Primero debes hacer una búsqueda específica de un usuario');
                return;
              }
              cargarEmpleadosEspecificos(userSearch.usuario.trim());
            }} 
            variant="secondary"
            disabled={isLoadingEmpleados}
          >
            {isLoadingEmpleados ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
        
        {isLoadingEmpleados ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Cargando empleados...</div>
          </div>
        ) : empleados.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Ingresa un código de usuario específico (ej: admin, jcredito01) y haz clic en "Consultar" para ver los resultados</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Nombre Empleado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Perfil
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    DFI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Estatus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Fecha Modificación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {empleados.map((empleado, index) => (
                  <tr key={empleado.noUsuario} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      {empleado.noUsuario}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      {empleado.nombreEmpleado}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      {empleado.nombrePerfil}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      {empleado.idDfi}
                    </td>
                    <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-600">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        empleado.estatusUsuario === 'ACTIVO' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {empleado.estatusUsuario}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      {empleado.fechaMod}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          className="text-xs px-2 py-1 flex items-center"
                          onClick={() => handleEditUsuario(empleado)}
                          title="Editar perfil"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Button>
                        {empleado.noUsuario.toLowerCase() !== 'admin' && (
                          <Button
                            variant="danger"
                            className="text-xs px-2 py-1 flex items-center"
                            onClick={() => handleDeleteUsuario(empleado.noUsuario)}
                            title="Eliminar usuario"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="bg-accent/10 dark:bg-accent-dark/10 border-accent dark:border-accent-dark">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Dar de baja usuarios
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Ingresa los datos para eliminar permisos de usuario:
        </p>
        <form onSubmit={handleMassDeleteSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Archivo de Eliminación Masiva:
            </label>
            <div className="flex items-center space-x-4">
              <span className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium">
                Elegir archivo
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {massDeleteFile ? massDeleteFile.name : 'No se eligió ningún archivo'}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {fileHelpText}
            </p>
          </div>
          
          <div className="flex justify-start">
            <Button type="submit" variant="primary">
              Eliminación Masiva
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal de Registro de Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Registro de Nuevo Usuario
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitNewUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Usuario:"
                    name="noUsuario"
                    value={newUser.noUsuario}
                    onChange={handleNewUserChange}
                    required
                    maxLength={50}
                    placeholder="Ej: j.perez"
                  />
                  
                  <FormField
                    label="Nombre del Empleado:"
                    name="nombreEmpleado"
                    value={newUser.nombreEmpleado}
                    onChange={handleNewUserChange}
                    required
                    maxLength={100}
                    placeholder="Nombre completo del empleado"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Contraseña:"
                    name="password"
                    type="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    required
                    maxLength={100}
                    placeholder="Contraseña del usuario"
                  />
                  
                  <SelectField
                    label="Perfil:"
                    name="idPerfil"
                    value={newUser.idPerfil}
                    onChange={handleNewUserChange}
                    options={PERFIL_OPTIONS_DB}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="DFI:"
                    name="idDfi"
                    type="number"
                    value={newUser.idDfi}
                    onChange={handleNewUserChange}
                    required
                    placeholder="ID del DFI"
                  />
                  
                  <FormField
                    label="Tienda (opcional):"
                    name="idEstacionamiento"
                    type="number"
                    value={newUser.idEstacionamiento}
                    onChange={handleNewUserChange}
                    placeholder="ID de la tienda (opcional)"
                  />
                </div>

                {submitError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {submitError}
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Perfil */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Editar Perfil de Usuario
              </h2>
              
              {submitError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {submitError}
                </div>
              )}
              
              <form onSubmit={handleSubmitEditUser}>
                <div className="space-y-4">
                  <FormField
                    label="Usuario"
                    name="noUsuario"
                    value={editUser.noUsuario}
                    onChange={handleEditUserChange}
                    disabled={true}
                    className="bg-gray-100 dark:bg-gray-700"
                  />
                  
                  <FormField
                    label="Nombre del Empleado"
                    name="nombreEmpleado"
                    value={editUser.nombreEmpleado}
                    onChange={handleEditUserChange}
                    disabled={true}
                    className="bg-gray-100 dark:bg-gray-700"
                  />
                  
                  <SelectField
                    label="Perfil"
                    name="idPerfil"
                    value={editUser.idPerfil}
                    onChange={handleEditUserChange}
                    options={PERFIL_OPTIONS_DB}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseEditModal}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Actualizando...' : 'Actualizar Perfil'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};