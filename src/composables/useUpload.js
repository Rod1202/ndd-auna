import { ref } from 'vue'
import {
    uploadFileChunksToStorage,
    uploadFileToStorage,
    createUploadJob,
    processFile,
    processFileChunk,
    getUploadStatus
} from '../services/uploadService'

export const useUpload = () => {
    const loading = ref(false)
    const progress = ref(0)
    const status = ref('')
    const total = ref(0)

    const upload = async (file) => {
        progress.value = 0
        total.value = 0

        try {
            loading.value = true
            status.value = 'Subiendo archivo...'

            const { uploadId, signedUpload, signedChunks, chunkSizeBytes } = await createUploadJob(file)

            let filePath = null
            let chunkPaths = null

            if (Array.isArray(signedChunks) && signedChunks.length > 1) {
                status.value = `Subiendo archivo en ${signedChunks.length} partes...`
                chunkPaths = await uploadFileChunksToStorage(file, signedChunks, chunkSizeBytes, ({ uploadedChunks, totalChunks, percent }) => {
                    progress.value = percent
                    status.value = `Subiendo parte ${uploadedChunks} de ${totalChunks}...`
                })
            } else {
                filePath = await uploadFileToStorage(file, signedUpload)
                progress.value = 45
            }

            status.value = 'Procesando archivo...'

            if (Array.isArray(chunkPaths) && chunkPaths.length > 1) {
                let chunkIndex = 0
                let headerLine = null
                let pendingLine = ''
                let totalProcessed = 0

                while (chunkIndex < chunkPaths.length) {
                    status.value = `Procesando parte ${chunkIndex + 1} de ${chunkPaths.length}...`

                    const result = await processFileChunk({
                        uploadId,
                        chunkPaths,
                        chunkIndex,
                        headerLine,
                        pendingLine,
                        totalProcessed
                    })

                    headerLine = result.headerLine
                    pendingLine = result.pendingLine || ''
                    totalProcessed = result.total || totalProcessed
                    total.value = totalProcessed
                    chunkIndex = result.nextChunkIndex
                    progress.value = Math.min(45 + Math.round((chunkIndex / chunkPaths.length) * 55), 99)

                    if (result.done) {
                        progress.value = 100
                        status.value = 'Completado'
                        loading.value = false
                        return
                    }
                }
            }

            processFile(uploadId, filePath, chunkPaths).catch((error) => {
                console.error(error)
                status.value = 'Error al procesar'
                loading.value = false
            })

            const interval = setInterval(async () => {
                try {
                    const data = await getUploadStatus(uploadId)

                    if (data) {
                        total.value = data.total_registros || 0
                        progress.value = data.estado === 'completed'
                            ? 100
                            : Math.min(Math.max(progress.value, 45) + 5, 95)

                        if (data.estado === 'completed') {
                            status.value = 'Completado'
                            clearInterval(interval)
                            loading.value = false
                        }

                        if (data.estado === 'failed') {
                            status.value = 'Error al procesar'
                            clearInterval(interval)
                            loading.value = false
                        }
                    }
                } catch (error) {
                    console.error(error)
                    status.value = 'Error consultando estado'
                    clearInterval(interval)
                    loading.value = false
                }
            }, 2000)

            setTimeout(() => {
                if (loading.value) {
                    clearInterval(interval)
                    status.value = 'Procesamiento en curso. Puedes revisar el dashboard en unos minutos.'
                    loading.value = false
                }
            }, 15 * 60 * 1000)

        } catch (error) {
            console.error(error)
            status.value = `Error: ${error.message || 'No se pudo subir el archivo'}`
            loading.value = false
        }
    }

    return {
        upload,
        loading,
        progress,
        status,
        total
    }
}
