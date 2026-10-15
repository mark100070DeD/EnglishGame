import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import './ui/styles.css';

new Phaser.Game(createGameConfig('game'));
