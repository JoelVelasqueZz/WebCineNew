// backend/src/controllers/comments/commentController.js
const Comment = require('../../models/Comment');
const { validationResult } = require('express-validator');

class CommentController {
    
    // ==================== MÉTODOS PÚBLICOS ====================

    /**
     * Crear nuevo comentario
     */
    async create(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { tipo, pelicula_id, titulo, contenido, puntuacion } = req.body;
            const usuario_id = req.user.id;

            // Validar que si es comentario de película, incluya puntuación
            if (tipo === 'pelicula' && (!puntuacion || puntuacion < 1 || puntuacion > 5)) {
                return res.status(400).json({
                    success: false,
                    message: 'Las reseñas de películas requieren puntuación entre 1 y 5 estrellas'
                });
            }

            // Verificar si ya comentó esta película
            if (tipo === 'pelicula') {
                const hasCommented = await Comment.hasUserCommented(usuario_id, pelicula_id);
                if (hasCommented) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya has comentado esta película. Puedes editar tu comentario existente.'
                    });
                }
            }

            const comentarioData = {
                usuario_id,
                tipo,
                pelicula_id: tipo === 'pelicula' ? pelicula_id : null,
                titulo,
                contenido,
                puntuacion: tipo === 'pelicula' ? puntuacion : null
            };

            const nuevoComentario = await Comment.create(comentarioData);

            res.status(201).json({
                success: true,
                message: 'Comentario creado exitosamente',
                data: nuevoComentario
            });

        } catch (error) {
            console.error('Error al crear comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener comentario por ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const comentario = await Comment.findById(id);

            if (!comentario) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            res.json({
                success: true,
                data: comentario
            });

        } catch (error) {
            console.error('Error al obtener comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener comentarios de una película
     */
    async getByMovie(req, res) {
        try {
            const { pelicula_id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const offset = (page - 1) * limit;
            const comentarios = await Comment.getByMovie(pelicula_id, parseInt(limit), offset);

            // Obtener estadísticas de la película
            const stats = await Comment.getMovieCommentsWithStats(pelicula_id);

            res.json({
                success: true,
                data: {
                    comentarios,
                    estadisticas: stats,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: stats.total_comentarios || 0
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios de película:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener comentarios del usuario actual
     */
    async getMyComments(req, res) {
        try {
            const usuario_id = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            
            const offset = (page - 1) * limit;
            const comentarios = await Comment.getByUser(usuario_id, parseInt(limit), offset);

            res.json({
                success: true,
                data: {
                    comentarios,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: comentarios.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios del usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener sugerencias del sistema
     */
    async getSystemFeedback(req, res) {
        try {
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;
            
            const sugerencias = await Comment.getSystemFeedback(parseInt(limit), offset);

            res.json({
                success: true,
                data: {
                    sugerencias,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: sugerencias.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Actualizar comentario
     */
    async update(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { titulo, contenido, puntuacion } = req.body;
            const usuario_id = req.user.id;

            const comentarioActualizado = await Comment.update(id, usuario_id, {
                titulo,
                contenido,
                puntuacion
            });

            if (!comentarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado o no tienes permisos para editarlo'
                });
            }

            res.json({
                success: true,
                message: 'Comentario actualizado exitosamente',
                data: comentarioActualizado
            });

        } catch (error) {
            console.error('Error al actualizar comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Eliminar comentario
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const usuario_id = req.user.id;

            const comentarioEliminado = await Comment.delete(id, usuario_id);

            if (!comentarioEliminado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado o no tienes permisos para eliminarlo'
                });
            }

            res.json({
                success: true,
                message: 'Comentario eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // ==================== MÉTODOS ADMIN ====================

    /**
     * Obtener todos los comentarios (admin)
     */
    async getAllForAdmin(req, res) {
        try {
            const { tipo, estado, usuario_id, page = 1, limit = 50 } = req.query;
            const filters = {};
            
            if (tipo) filters.tipo = tipo;
            if (estado) filters.estado = estado;
            if (usuario_id) filters.usuario_id = usuario_id;

            const offset = (page - 1) * limit;
            const comentarios = await Comment.getAllForAdmin(filters, parseInt(limit), offset);

            // Obtener estadísticas generales
            const stats = await Comment.getStats();

            res.json({
                success: true,
                data: {
                    comentarios,
                    estadisticas: stats,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: comentarios.length
                    }
                }
            });

        } catch (error) {
            console.error('Error al obtener comentarios (admin):', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Cambiar estado del comentario (admin)
     */
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!['activo', 'oculto', 'moderacion', 'rechazado'].includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
            }

            const comentarioActualizado = await Comment.updateStatus(id, estado);

            if (!comentarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            res.json({
                success: true,
                message: `Estado cambiado a: ${estado}`,
                data: comentarioActualizado
            });

        } catch (error) {
            console.error('Error al cambiar estado del comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Destacar/quitar destaque de comentario (admin)
     */
    async toggleFeatured(req, res) {
        try {
            const { id } = req.params;

            const comentarioActualizado = await Comment.toggleFeatured(id);

            if (!comentarioActualizado) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            const mensaje = comentarioActualizado.es_destacado 
                ? 'Comentario destacado' 
                : 'Destaque removido';

            res.json({
                success: true,
                message: mensaje,
                data: comentarioActualizado
            });

        } catch (error) {
            console.error('Error al cambiar destaque del comentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = new CommentController();