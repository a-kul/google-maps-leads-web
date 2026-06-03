from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://leads:leads@db:5432/leads"
    celery_broker_url: str = "amqp://guest:guest@rabbitmq:5672//"


settings = Settings()
