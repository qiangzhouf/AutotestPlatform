import logging


# 日志格式，和模式设置
def log_config(f_level=logging.DEBUG, c_level=logging.WARNING, log_file='./log.txt'):
    logger = logging.getLogger()  
    logger.setLevel(logging.DEBUG)    # Log等级总开关  
 
    logfile = log_file 
    fh = logging.FileHandler(logfile, mode='a')  
    fh.setLevel(f_level)   # 输出到file的log等级的开关  

    ch = logging.StreamHandler()  
    ch.setLevel(c_level)   # 输出到console的log等级的开关  

    # 输出格式  
    formatter = logging.Formatter('[%(asctime)s] - %(filename)s'
                                  ' - [%(levelname)s]: %(message)s') 
    fh.setFormatter(formatter)  
    ch.setFormatter(formatter)  
    logger.addHandler(fh)  
    logger.addHandler(ch)
    
    return logger