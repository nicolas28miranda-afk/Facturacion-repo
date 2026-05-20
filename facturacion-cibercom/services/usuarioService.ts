export interface UsuarioRegistro {
  noUsuario: string;
  nombreEmpleado: string;
  password: string;
  estatusUsuario: string;
  idPerfil: number;
  idDfi?: number;
  idEstacionamiento?: number;
  modificaUbicacion?: string;
}

export interface PerfilResponse {
  idPerfil: number;
  nombrePerfil: string;
  statusPerfil: string;
}

export interface EmpleadoConsulta {
  noUsuario: string;
  nombreEmpleado: string;
  nombrePerfil: string;
  idDfi: number;
  estatusUsuario: string;
  fechaMod: string;
  usuarioMod: string;
  correo?: string;
  rfc?: string;
  curp?: string;
  salarioBase?: number;
}

export interface UsuarioRegistroResponse {
  success: boolean;
  message: string;
  usuario?: {
    noUsuario: string;
    nombreEmpleado: string;
    estatusUsuario: string;
    perfil: PerfilResponse;
  };
}

import { API_BASE_URL } from './api';

export const usuarioService = {
  async registrarUsuario(usuario: UsuarioRegistro): Promise<UsuarioRegistroResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Error en el registro',
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor',
      };
    }
  },

  async obtenerPerfiles(): Promise<PerfilResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/perfiles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error al obtener perfiles:', response.statusText);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener perfiles:', error);
      return [];
    }
  },

  async consultarEmpleados(): Promise<EmpleadoConsulta[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/empleados`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error al consultar empleados:', response.statusText);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error al consultar empleados:', error);
      return [];
    }
  },

  async consultarEmpleadosEspecificos(usuario: string): Promise<EmpleadoConsulta[]> {
    try {
      // Backend espera el parámetro 'noUsuario' para filtrar por código de usuario
      const response = await fetch(`${API_BASE_URL}/usuarios/empleados?noUsuario=${encodeURIComponent(usuario)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error al consultar empleados específicos:', response.statusText);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error al consultar empleados específicos:', error);
      return [];
    }
  },

  async actualizarPerfil(noUsuario: string, idPerfil: number, usuarioMod: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/actualizar-perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noUsuario,
          idPerfil,
          usuarioMod
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al actualizar perfil'
        };
      }

      return result;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return {
        success: false,
        message: 'Error de conexión al actualizar perfil'
      };
    }
  },

  async eliminarUsuario(noUsuario: string, usuarioMod: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/eliminar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noUsuario,
          usuarioMod
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error al eliminar usuario'
        };
      }

      return result;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return {
        success: false,
        message: 'Error de conexión al eliminar usuario'
      };
    }
  },
};