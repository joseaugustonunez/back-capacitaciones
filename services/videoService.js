const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs-extra');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath); 

class VideoService {
  async processVideo(videoPath) {
    const filename = path.basename(videoPath, path.extname(videoPath));

    const thumbnailsDir = path.join(__dirname, '../uploads/thumbnails');

    await fs.ensureDir(thumbnailsDir);

    const thumbnailPath = path.join(thumbnailsDir, `${filename}-thumbnail.jpg`);

    try {
      const duration = await this.getVideoDuration(videoPath);
      await this.generateThumbnail(videoPath, thumbnailPath);

      return {
        duration,
        thumbnailPath
      };
    } catch (error) {
      throw new Error(`Error procesando video: ${error.message}`);
    }
  }

  getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(new Error(`Error al obtener metadata del video: ${err.message}`));
        }
        if (!metadata || !metadata.format || typeof metadata.format.duration !== 'number') {
          return reject(new Error('No se pudo obtener la duración del video. El archivo puede estar corrupto o no es un video válido.'));
        }
        resolve(metadata.format.duration);
      });
    });
  }

  generateThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['50%'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '320x180'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', reject);
    });
  }
}

module.exports = new VideoService();
