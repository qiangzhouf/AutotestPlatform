import logging


# 日志格式，和模式设置
def log_config(c_level=logging.WARNING):
    logger = logging.getLogger()  
    logger.setLevel(logging.DEBUG)    # Log等级总开关  

    ch = logging.StreamHandler()  
    ch.setLevel(c_level)   # 输出到console的log等级的开关  

    # 输出格式  
    formatter = logging.Formatter('[%(asctime)s] - %(filename)s'
                                  ' - [%(levelname)s]: %(message)s') 
    ch.setFormatter(formatter)   
    logger.addHandler(ch)
    
    return logger