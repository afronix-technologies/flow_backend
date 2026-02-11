import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-strategy';

class NoOpStrategy extends Strategy {
  name: string;

  constructor() {
    super();
    this.name = 'noop';
  }

  authenticate() {
    this.fail({ message: 'OAuth provider not configured' }, 400);
  }
}

export function buildUnconfiguredStrategy(strategyName: string) {
  @Injectable()
  class UnconfiguredStrategyImpl extends PassportStrategy(NoOpStrategy, strategyName) {
    constructor() {
      super();
    }
  }
  return UnconfiguredStrategyImpl;
}
